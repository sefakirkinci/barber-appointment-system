function HomePage({ onBookAppointment }) {

const contactInfo = {
  address:
    "Müftü Solakzade, Yıldızkent Zabıta Mrk., 25070 Palandöken/Erzurum",

  phone: "05304785290",

  // WhatsApp bağlantısında ülke kodu kullanılır.
  whatsapp: "905304785290",

  instagram: "",
};

  const encodedAddress = encodeURIComponent(
    contactInfo.address
  );

  const googleMapsUrl =
  "https://maps.app.goo.gl/R1CxyAJ3jhmg4EZ78";

  const googleMapsEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d765.46832449105!2d41.2455284!3d39.8770759!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x406e5e6380e78341%3A0x347c078281631ec9!2sFORMEN%20ERKEK%20KUAFORU!5e0!3m2!1sen!2str!4v1785134620175!5m2!1sen!2str";

  const advantages = [
    {
      icon: "✂️",
      title: "Profesyonel Hizmet",
      description:
        "Deneyimli uygulamalarla modern ve klasik kesim seçenekleri.",
    },
    {
      icon: "🕒",
      title: "Kolay Randevu",
      description:
        "Size uygun gün ve saati birkaç adımda seçebilirsiniz.",
    },
    {
      icon: "✨",
      title: "Özenli Bakım",
      description:
        "Kişisel tarzınıza ve ihtiyaçlarınıza uygun hizmet anlayışı.",
    },
  ];

  const services = [
    {
      icon: "✂️",
      title: "Saç Kesimi",
      description:
        "Yüz şeklinize ve tarzınıza uygun modern veya klasik saç kesimi.",
    },
    {
      icon: "🧔",
      title: "Sakal Tıraşı",
      description:
        "Sakal düzeltme, şekillendirme ve kişiye özel tasarım.",
    },
    {
      icon: "💇",
      title: "Saç Bakımı",
      description:
        "Saçınızın daha sağlıklı ve bakımlı görünmesi için bakım uygulamaları.",
    },
    {
      icon: "👦",
      title: "Çocuk Kesimi",
      description:
        "Çocuklara uygun, rahat ve özenli saç kesimi hizmeti.",
    },
  ];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-label">
            Formen Kuaför
          </p>

          <h1>
            Tarzınızı Yenilemenin
            <span> Tam Zamanı</span>
          </h1>

          <p className="home-description">
            Size uygun tarihi ve saati seçerek
            kuaför randevunuzu kolayca oluşturun.
            Bakımlı ve özgün görünümünüz için
            profesyonel hizmet alın.
          </p>

          <div className="home-actions">
            <button
              type="button"
              className="home-book-button"
              onClick={onBookAppointment}
            >
              Randevu Al
            </button>
          </div>
        </div>

        <div className="home-information-card">
          <h2>Kolay Randevu</h2>

          <div className="home-information-item">
            <span>1</span>

            <div>
              <h3>Tarih Seçin</h3>

              <p>
                Size uygun çalışma gününü
                belirleyin.
              </p>
            </div>
          </div>

          <div className="home-information-item">
            <span>2</span>

            <div>
              <h3>Saat Seçin</h3>

              <p>
                Müsait randevu saatlerinden
                birini seçin.
              </p>
            </div>
          </div>

          <div className="home-information-item">
            <span>3</span>

            <div>
              <h3>Randevunuzu Oluşturun</h3>

              <p>
                Bilgilerinizi girerek işlemi
                tamamlayın.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <p className="home-section-label">
            Neden Formen Kuaför?
          </p>

          <h2>
            Kendinizi iyi hissettiren
            profesyonel hizmet
          </h2>

          <p>
            Randevu sürecinden hizmet sonuna kadar
            rahat, düzenli ve özenli bir deneyim
            sunuyoruz.
          </p>
        </div>

        <div className="advantage-grid">
          {advantages.map((advantage) => (
            <article
              className="advantage-card"
              key={advantage.title}
            >
              <div className="advantage-icon">
                {advantage.icon}
              </div>

              <h3>{advantage.title}</h3>

              <p>{advantage.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section services-section">
        <div className="home-section-heading">
          <p className="home-section-label">
            Hizmetlerimiz
          </p>

          <h2>
            Tarzınıza uygun bakım seçenekleri
          </h2>

          <p>
            Günlük bakımınızdan özel gün
            hazırlıklarınıza kadar ihtiyaçlarınıza
            uygun hizmetleri keşfedin.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <article
              className="service-card"
              key={service.title}
            >
              <div className="service-icon">
                {service.icon}
              </div>

              <div className="service-content">
                <h3>{service.title}</h3>

                <p>{service.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="services-action">
          <button
            type="button"
            className="home-book-button"
            onClick={onBookAppointment}
          >
            Hemen Randevu Al
          </button>
        </div>
      </section>

            <section className="home-section contact-location-section">
        <div className="home-section-heading">
          <p className="home-section-label">
            Bize Ulaşın
          </p>

          <h2>Konum ve İletişim</h2>

          <p>
            Adresimizi harita üzerinden görüntüleyebilir
            ve tek tıkla yol tarifi alabilirsiniz.
          </p>
        </div>

        <div className="contact-location-grid">
          <div className="location-card">
            <div className="location-card-heading">
              <span className="contact-icon">
                📍
              </span>

              <div>
                <h3>Konumumuz</h3>

                <p>{contactInfo.address}</p>
              </div>
            </div>

            <div className="map-container">
              <iframe
                title="Formen Kuaför Konumu"
                src={googleMapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <a
              className="directions-button"
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Yol Tarifi Al
            </a>
          </div>

          <div className="contact-card-list">
            <article className="contact-card">
              <span className="contact-icon">
                📍
              </span>

              <div>
                <h3>Adres</h3>

                <p>{contactInfo.address}</p>
              </div>
            </article>

            <article className="contact-card">
              <span className="contact-icon">
                📞
              </span>

              <div>
                <h3>Telefon</h3>

                {contactInfo.phone ? (
                  <a
                    href={`tel:${contactInfo.phone}`}
                  >
                    {contactInfo.phone}
                  </a>
                ) : (
                  <p>Telefon bilgisi eklenecek.</p>
                )}
              </div>
            </article>

            <article className="contact-card">
              <span className="contact-icon">
                💬
              </span>

              <div>
                <h3>WhatsApp</h3>

                {contactInfo.whatsapp ? (
                  <>
                    <p className="contact-whatsapp-number">
                      +{contactInfo.whatsapp}
                    </p>

                    <a
                      href={`https://wa.me/${
                        contactInfo.whatsapp
                      }?text=${encodeURIComponent(
                        "Merhaba, Formen Kuaför hakkında bilgi almak istiyorum."
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp ile iletişime geç
                    </a>
                  </>
                ) : (
                  <p>WhatsApp bağlantısı eklenecek.</p>
                )}
              </div>
            </article>

          </div>
        </div>
      </section>

      <footer className="site-footer">
  <div className="site-footer-content">
    <div>
      <h2>Formen Kuaför</h2>

      <p>
        Modern görünüm, özenli bakım ve kolay
        online randevu deneyimi.
      </p>
    </div>

    <div className="footer-links">
      <a href={`tel:${contactInfo.phone}`}>
        📞 Telefon
      </a>

      <a
        href={`https://wa.me/${
          contactInfo.whatsapp
        }?text=${encodeURIComponent(
          "Merhaba, Formen Kuaför hakkında bilgi almak istiyorum."
        )}`}
        target="_blank"
        rel="noreferrer"
      >
        💬 WhatsApp
      </a>
    </div>
  </div>

  <div className="site-footer-bottom">
    <p>
      © {new Date().getFullYear()} Formen Kuaför.
      Tüm hakları saklıdır.
    </p>
  </div>
</footer>

    </main>
  );
}

export default HomePage;