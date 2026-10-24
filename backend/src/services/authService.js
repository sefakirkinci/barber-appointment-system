const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/*
  Kullanıcı önce admins tablosunda aranır.

  Admin bulunamazsa barbers tablosunda aranır.
  Böylece admin ve berber aynı giriş endpoint'ini
  kullanabilir.
*/
async function login(username, password) {
  if (!username || !password) {
    return {
      status: 400,
      message:
        "Kullanıcı adı ve şifre zorunludur.",
    };
  }

  /*
    Önce işletme yöneticisini arıyoruz.
  */
  const adminResult = await pool.query(
    `
      SELECT
        id,
        username,
        password_hash,
        must_change_password
      FROM admins
      WHERE username = $1
    `,
    [username]
  );

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.password_hash
      );

    if (!passwordMatches) {
      return {
        status: 401,
        message:
          "Kullanıcı adı veya şifre hatalı.",
      };
    }

    const token = jwt.sign(
      {
        userId: admin.id,
        username: admin.username,
        role: "admin",
        barberId: null,

        /*
          Eski middleware ve kodlarla geriye
          uyumluluk için adminId de tutuluyor.
        */
        adminId: admin.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    const user = {
      id: admin.id,
      username: admin.username,
      role: "admin",
      barberId: null,
      mustChangePassword:
        admin.must_change_password,
    };

    return {
      status: 200,
      message: "Giriş başarılı.",
      token,
      user,

      /*
        Mevcut frontend data.admin okuduğu için
        şimdilik admin alanını da gönderiyoruz.
      */
      admin: user,
    };
  }

  /*
    Admin bulunmadıysa aktif bir berber
    hesabı arıyoruz.
  */
  const barberResult = await pool.query(
    `
      SELECT
        id,
        name,
        surname,
        username,
        password_hash,
        role,
        is_active,
        must_change_password
      FROM barbers
      WHERE username = $1
    `,
    [username]
  );

  if (barberResult.rowCount === 0) {
    return {
      status: 401,
      message:
        "Kullanıcı adı veya şifre hatalı.",
    };
  }

  const barber = barberResult.rows[0];

  if (!barber.is_active) {
    return {
      status: 403,
      message:
        "Bu berber hesabı pasif durumdadır.",
    };
  }

  const passwordMatches =
    await bcrypt.compare(
      password,
      barber.password_hash
    );

  if (!passwordMatches) {
    return {
      status: 401,
      message:
        "Kullanıcı adı veya şifre hatalı.",
    };
  }

  const token = jwt.sign(
    {
      userId: barber.id,
      username: barber.username,
      role: "barber",
      barberId: barber.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );

  const user = {
    id: barber.id,
    username: barber.username,
    name: barber.name,
    surname: barber.surname,
    role: "barber",
    barberId: barber.id,
    mustChangePassword:
      barber.must_change_password,
  };

  return {
    status: 200,
    message: "Giriş başarılı.",
    token,
    user,

    /*
      Mevcut frontend'in data.admin kullanımını
      hemen bozmamak için aynı kullanıcıyı
      admin anahtarıyla da gönderiyoruz.
    */
    admin: user,
  };
}

/*
  Giriş yapan kullanıcının rolüne göre doğru
  tablodaki şifreyi değiştirir.
*/
async function changePassword(
  userId,
  role,
  newPassword
) {
  if (!newPassword) {
    return {
      status: 400,
      message: "Yeni şifre zorunludur.",
    };
  }

  if (newPassword.length < 8) {
    return {
      status: 400,
      message:
        "Yeni şifre en az 8 karakter olmalıdır.",
    };
  }

  if (!["admin", "barber"].includes(role)) {
    return {
      status: 403,
      message:
        "Bu hesap türü için şifre değiştirilemez.",
    };
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    10
  );

  /*
    Giriş yapan kişi admin ise admins tablosu
    güncellenir.
  */
  if (role === "admin") {
    const result = await pool.query(
      `
        UPDATE admins
        SET
          password_hash = $1,
          must_change_password = FALSE
        WHERE id = $2
        RETURNING
          id,
          username,
          must_change_password
      `,
      [passwordHash, userId]
    );

    if (result.rowCount === 0) {
      return {
        status: 404,
        message:
          "Yönetici hesabı bulunamadı.",
      };
    }

    return {
      status: 200,
      message:
        "Şifreniz başarıyla değiştirildi.",
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        role: "admin",
        barberId: null,
        mustChangePassword:
          result.rows[0].must_change_password,
      },
    };
  }

  /*
    Giriş yapan kişi berber ise barbers tablosu
    güncellenir.
  */
  const result = await pool.query(
    `
      UPDATE barbers
      SET
        password_hash = $1,
        must_change_password = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND is_active = TRUE
      RETURNING
        id,
        name,
        surname,
        username,
        must_change_password
    `,
    [passwordHash, userId]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Aktif berber hesabı bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      "Şifreniz başarıyla değiştirildi.",
    user: {
      id: result.rows[0].id,
      username: result.rows[0].username,
      name: result.rows[0].name,
      surname: result.rows[0].surname,
      role: "barber",
      barberId: result.rows[0].id,
      mustChangePassword:
        result.rows[0].must_change_password,
    },
  };
}

async function updateUsername(
  adminId,
  username
) {
  if (!username?.trim()) {
    return {
      status: 400,
      message:
        "Kullanıcı adı zorunludur.",
    };
  }

  const normalizedUsername =
    username.trim().toLowerCase();

  if (
    !/^[a-z0-9._-]{3,30}$/.test(
      normalizedUsername
    )
  ) {
    return {
      status: 400,
      message:
        "Kullanıcı adı 3-30 karakter olmalı ve yalnızca küçük harf, rakam, nokta, alt çizgi veya tire içermelidir.",
    };
  }

  const usernameResult =
    await pool.query(
      `
        SELECT id
        FROM admins
        WHERE LOWER(username) =
          LOWER($1)
          AND id <> $2

        UNION ALL

        SELECT id
        FROM barbers
        WHERE LOWER(username) =
          LOWER($1)

        LIMIT 1
      `,
      [
        normalizedUsername,
        adminId,
      ]
    );

  if (
    usernameResult.rowCount > 0
  ) {
    return {
      status: 409,
      message:
        "Bu kullanıcı adı zaten kullanılıyor.",
    };
  }

  const result = await pool.query(
    `
      UPDATE admins
      SET
        username = $1
      WHERE id = $2
      RETURNING
        id,
        username,
        must_change_password
    `,
    [
      normalizedUsername,
      adminId,
    ]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      message:
        "Yönetici hesabı bulunamadı.",
    };
  }

  return {
    status: 200,
    message:
      "Kullanıcı adı başarıyla güncellendi.",
    admin: {
      id: result.rows[0].id,
      username:
        result.rows[0].username,
      mustChangePassword:
        result.rows[0]
          .must_change_password,
    },
  };
}

module.exports = {
  login,
  changePassword,
  updateUsername,
};