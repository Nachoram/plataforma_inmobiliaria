'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ContactForm } from '../components/ContactForm';
import { Briefcase, Users } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
      },
    },
    hover: {
      y: -5,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.3,
      },
    },
  };

  const handleContactSubmit = (data: any) => {
    console.log('Formulario enviado:', data);
    // Aquí se puede integrar con backend o servicio de email
  };

  // ═══════════════════════════════════════════════════════════════
  // SECCIÓN 1: HERO
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="bg-white overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-blue-200 to-blue-900 text-white overflow-hidden rounded-3xl">
        {/* Fondo animado con círculos */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <motion.div
          className="absolute bottom-0 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />

        {/* Contenido del Hero */}
        <div className="relative max-w-6xl mx-auto px-4 py-7 md:py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >

            <motion.div
              variants={itemVariants}
              className="mb-4"
            >
              <img
                src="/logo-superior.svg"
                alt="PROPAI"
                className="h-64 md:h-80 mx-auto drop-shadow-lg"
              />
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-blue-200 mb-4 max-w-xl mx-auto leading-tight"
            >
              Tu aliado en la gestión integral de propiedades. Centraliza, profesionaliza
              y automatiza tu negocio inmobiliario en un solo lugar.
            </motion.p>

            {/* Botones */}
            <motion.div
              variants={itemVariants}
              className="flex gap-4 justify-center flex-wrap"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                Explorar Plataforma
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
              >
                Contáctanos
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 2: QUIÉNES SOMOS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <motion.h2 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            ¿Quiénes Somos?
          </span>
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
          className="h-1 bg-gradient-to-r from-teal-400 to-blue-400 w-32 mx-auto mb-6 origin-center"
        />
      </motion.div>

          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-3 gap-8"
          >
            {/* MISIÓN */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-gradient-to-br from-teal-50 to-teal-200 p-8 rounded-3xl border border-teal-200 cursor-pointer"
            >
              <motion.div
                className="text-5xl mb-4"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                🎯
              </motion.div>
              <h3 className="text-2xl font-bold text-teal-700 mb-4">Misión</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                Profesionalizar y automatizar el ciclo completo del arriendo en Chile,
                transformando la forma en que corredores e inmobiliarias gestionan
                sus propiedades y postulantes.
              </p>
            </motion.div>

            {/* VISIÓN */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-gradient-to-br from-teal-50 to-teal-200 p-8 rounded-3xl border border-teal-200 cursor-pointer"
            >
              <motion.div
                className="text-5xl mb-4"
                whileHover={{ scale: 1.2, rotate: -10 }}
              >
                ⭐
              </motion.div>
              <h3 className="text-2xl font-bold text-green-900 mb-4">Visión</h3>
              <p className="text-gray-700 leading-relaxed text-lg">
                Ser la plataforma referente en gestión inmobiliaria transaccional en
                Latinoamérica, eliminando ineficiencias y centralizando todo en una
                solución integral.
              </p>
            </motion.div>

            {/* VALORES */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="bg-gradient-to-br from-teal-50 to-teal-200 p-8 rounded-3xl border border-teal-200 cursor-pointer"
            >
              <motion.div
                className="text-5xl mb-4"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                💡
              </motion.div>
              <h3 className="text-2xl font-bold text-teal-700 mb-4">Nuestros Valores</h3>
              <ul className="space-y-3">
                {['Transparencia', 'Eficiencia Operativa', 'Seguridad Legal', 'Innovación Continua', 'Experiencia UX'].map((value, idx) => (
                  <motion.li
                    key={value}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span className="text-green-500 font-bold">✓</span>
                    {value}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 3: NUESTROS SERVICIOS
          ═══════════════════════════════════════════════════════════════ */}


      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4"
            >
              Nuestros Servicios
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
              className="h-1 bg-gradient-to-r from-teal-400 to-blue-400 w-32 mx-auto mb-6 origin-center"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Soluciones integrales diseñadas para optimizar cada aspecto de tu negocio inmobiliario
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* PARA CORREDORES Y PROPIETARIOS */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 h-full"
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Briefcase className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Para Corredores y Propietarios
                    </h3>
                    <p className="text-gray-600">Herramientas profesionales para maximizar tu eficiencia</p>
                  </div>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid gap-4"
                >
                  {[
                    { icon: '📋', text: 'Gestión centralizada de postulaciones', desc: 'Administra todas tus postulaciones desde un solo lugar' },
                    { icon: '✍️', text: 'Contratos con firma electrónica', desc: 'Genera y firma contratos de forma digital y segura' },
                    { icon: '💰', text: 'Cobros automatizados', desc: 'Sistema inteligente de recordatorios y cobros de arriendos' },
                    { icon: '📊', text: 'Informes comerciales', desc: 'Accede a reportes detallados de tus postulantes' },
                    { icon: '🔒', text: 'Portal seguro de documentos', desc: 'Almacenamiento seguro para toda tu documentación legal' },
                    { icon: '🤖', text: 'Chatbot inteligente', desc: 'Para derivar al postulante o arrendatario hacia la plataforma' }
                  ].map((service) => (
                    <motion.div
                      key={service.text}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <motion.span
                          className="text-2xl flex-shrink-0"
                          whileHover={{ scale: 1.3, rotate: 10 }}
                        >
                          {service.icon}
                        </motion.span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {service.text}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 group-hover:text-blue-600 transition-colors">
                            {service.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* PARA POSTULANTES */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 h-full"
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div
                    whileHover={{ rotate: -10, scale: 1.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Users className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Para Postulantes
                    </h3>
                    <p className="text-gray-600">Encuentra tu hogar ideal de forma simple y segura</p>
                  </div>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid gap-4"
                >
                  {[
                    { icon: '🔍', text: 'Búsqueda avanzada', desc: 'acción a postulación por link' },
                    { icon: '📝', text: 'Postulación simplificada', desc: 'Aplica a propiedades con un solo clic' },
                    { icon: '❤️', text: 'Sistema de favoritos', desc: 'Guarda y organiza tus propiedades preferidas' },
                    { icon: '📈', text: 'Seguimiento en tiempo real', desc: 'Monitorea el estado de todas tus postulaciones' },
                    { icon: '💬', text: 'Comunicación directa', desc: 'Contacta con propietarios de forma segura' },
                    { icon: '📁', text: 'Portafolio personal', desc: 'Crea tu perfil completo de postulante' }
                  ].map((service) => (
                    <motion.div
                      key={service.text}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group bg-gradient-to-r from-teal-50 to-transparent p-4 rounded-xl border border-teal-100 hover:border-teal-300 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <motion.span
                          className="text-2xl flex-shrink-0"
                          whileHover={{ scale: 1.3, rotate: -10 }}
                        >
                          {service.icon}
                        </motion.span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                            {service.text}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 group-hover:text-teal-600 transition-colors">
                            {service.desc}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 4: CONTÁCTANOS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4"
            >
              Contáctanos
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              viewport={{ once: true }}
              className="h-1 bg-gradient-to-r from-teal-400 to-blue-400 w-32 mx-auto mb-6 origin-center"
            />
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              ¿Listo para revolucionar tu negocio inmobiliario? Hablemos de cómo podemos ayudarte
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Información de contacto */}
            <motion.div
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 h-full"
              >
                <div className="flex items-center gap-4 mb-8">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      Hablemos
                    </h3>
                    <p className="text-gray-600">Estamos aquí para ayudarte</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-6 p-6 bg-gradient-to-r from-teal-50 to-teal-100/50 rounded-2xl border border-teal-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900 mb-1">Teléfono</p>
                      <p className="text-gray-700 font-medium">+56 9 1234 5678</p>
                      <p className="text-sm text-gray-500 mt-1">Lun - Vie: 9:00 - 18:00</p>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-900 mb-1">Email</p>
                      <p className="text-gray-700 font-medium">contacto@propai.cl</p>
                      <p className="text-sm text-gray-500 mt-1">Respuesta en menos de 24 horas</p>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            </motion.div>

            {/* Formulario de contacto */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-gray-100 h-full flex flex-col"
              >
                <ContactForm onSubmit={handleContactSubmit} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECCIÓN 5: LLAMADA A ACCIÓN
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-white to-blue-800 text-white relative rounded-3xl">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            ¿Listo para Transformar tu Negocio?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-base md:text-lg text-blue-100 mb-6 max-w-2xl mx-auto leading-tight"
          >
            Confían en PROPAI para profesionalizar su gestión inmobiliaria.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            Solicita una Demostración
          </motion.button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

