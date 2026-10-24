const jwt = require("jsonwebtoken");

/*
  Authorization başlığındaki token'ı okur ve
  doğrular.

  Hem admin hem berber bu middleware'i
  kullanabilir.
*/
function verifyAuthToken(req, res, next) {
  const authorizationHeader =
    req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).json({
      message:
        "Bu işlem için giriş yapmanız gereklidir.",
    });
  }

  const [tokenType, token] =
    authorizationHeader.split(" ");

  if (tokenType !== "Bearer" || !token) {
    return res.status(401).json({
      message:
        "Geçersiz yetkilendirme bilgisi.",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /*
      Yeni tokenlarda userId bulunur.

      Eski admin tokenlarının geçici olarak
      çalışmaya devam etmesi için adminId
      yedek olarak kullanılır.
    */
    const userId =
      decodedToken.userId ||
      decodedToken.adminId;

    const role =
      decodedToken.role || "admin";

    if (!userId) {
      return res.status(401).json({
        message:
          "Oturum bilgisi geçersizdir.",
      });
    }

    req.user = {
      id: userId,
      username: decodedToken.username,
      role,
      barberId:
        role === "barber"
          ? decodedToken.barberId || userId
          : null,
    };

    /*
      Mevcut controller ve route'larda req.admin
      kullanımı olduğu için admin girişlerinde
      geriye uyumluluk sağlıyoruz.
    */
    if (role === "admin") {
      req.admin = {
        id: userId,
        username: decodedToken.username,
      };
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message:
          "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
      });
    }

    return res.status(401).json({
      message:
        "Oturumunuz geçersiz. Lütfen tekrar giriş yapın.",
    });
  }
}

/*
  Yalnızca işletme yöneticisinin erişebileceği
  endpoint'lerde kullanılır.

  Önce token doğrulanır, sonra role kontrol edilir.
*/
function verifyAdminToken(req, res, next) {
  verifyAuthToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Bu işlem yalnızca işletme yöneticisi tarafından yapılabilir.",
      });
    }

    req.admin = {
      id: req.user.id,
      username: req.user.username,
    };

    next();
  });
}

/*
  Yalnızca berber hesaplarının erişebileceği
  endpoint'lerde kullanılacak.
*/
function verifyBarberToken(req, res, next) {
  verifyAuthToken(req, res, () => {
    if (req.user.role !== "barber") {
      return res.status(403).json({
        message:
          "Bu işlem yalnızca berber hesabıyla yapılabilir.",
      });
    }

    next();
  });
}

/*
  Hem admin hem berber erişebilir.

  İleride randevu ve çalışma saatleri
  endpoint'lerinde kullanabiliriz.
*/
function verifyStaffToken(req, res, next) {
  verifyAuthToken(req, res, () => {
    if (
      req.user.role !== "admin" &&
      req.user.role !== "barber"
    ) {
      return res.status(403).json({
        message:
          "Bu işlem için personel yetkisi gereklidir.",
      });
    }

    next();
  });
}

module.exports = {
  verifyAuthToken,
  verifyAdminToken,
  verifyBarberToken,
  verifyStaffToken,
};