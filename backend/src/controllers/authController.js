const authService = require(
  "../services/authService"
);

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const result = await authService.login(
      username,
      password
    );

    return res.status(result.status).json({
      message: result.message,
      token: result.token,

      /*
        Yeni frontend yapısında user kullanılacak.
      */
      user: result.user,

      /*
        Mevcut frontend data.admin kullandığı için
        geriye uyumluluk amacıyla korunuyor.
      */
      admin: result.admin,
    });
  } catch (error) {
    console.error("Giriş hatası:", error);

    return res.status(500).json({
      message:
        "Giriş işlemi sırasında bir sunucu hatası oluştu.",
    });
  }
}

async function changePassword(req, res) {
  try {
    const { newPassword } = req.body;

    /*
      req.user bilgisi authMiddleware tarafından
      doğrulanmış JWT token'dan oluşturulur.
    */
    const result =
      await authService.changePassword(
        req.user.id,
        req.user.role,
        newPassword
      );

    return res.status(result.status).json({
      message: result.message,
      user: result.user,

      /*
        Mevcut AdminChangePassword bileşenini
        bozmamak için aynı kullanıcı admin
        alanında da gönderiliyor.
      */
      admin: result.user,
    });
  } catch (error) {
    console.error(
      "Şifre değiştirme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Şifre değiştirilirken bir sunucu hatası oluştu.",
    });
  }
}

async function updateUsername(
  req,
  res
) {
  try {
    const { username } =
      req.body;

    const result =
      await authService
        .updateUsername(
          req.admin.id,
          username
        );

    return res
      .status(result.status)
      .json({
        message:
          result.message,
        admin: result.admin,
      });
  } catch (error) {
    console.error(
      "Yönetici kullanıcı adı güncelleme hatası:",
      error
    );

    return res.status(500).json({
      message:
        "Kullanıcı adı güncellenirken bir sunucu hatası oluştu.",
    });
  }
}
module.exports = {
  login,
  changePassword,
  updateUsername,
};