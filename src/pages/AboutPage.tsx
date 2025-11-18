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
  const [expandedService, setExpandedService] = React.useState<string | null>(null);

  const handleScrollToContact = () => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
                src="/logo-hero-3.svg"
                alt="PROPAI"
                className="h-[400px] md:h-[500px] mx-auto drop-shadow-lg"
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
                onClick={handleScrollToContact}
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
                    {
                      icon: '📋',
                      text: 'Gestión centralizada de postulaciones',
                      desc: 'Administra todas tus postulaciones desde un solo lugar',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo realizamos la gestión centralizada?',
                        steps: [
                          '📊 Dashboard intuitivo con métricas en tiempo real de todas tus propiedades',
                          '🔍 Sistema de filtros avanzados por estado, fecha, precio y tipo de propiedad',
                          '📱 Notificaciones automáticas push cuando llegan nuevas postulaciones',
                          '📈 Reportes detallados de conversión y rendimiento por propiedad',
                          '🔄 Sincronización automática con múltiples plataformas inmobiliarias',
                          '👥 Perfiles completos de postulantes con historial y referencias',
                          '⚡ Respuestas rápidas con plantillas personalizables',
                          '📊 Análisis de mercado integrado para evaluar postulaciones'
                        ]
                      }
                    },
                    {
                      icon: '✍️',
                      text: 'Contratos con firma electrónica',
                      desc: 'Genera y firma contratos de forma digital y segura',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funcionan nuestros contratos electrónicos?',
                        steps: [
                          '📝 Generación automática de contratos personalizados según tipo de propiedad',
                          '🔐 Firma digital certificada con validez legal en todo Chile',
                          '📧 Envío automático por email a todas las partes involucradas',
                          '📋 Seguimiento en tiempo real del estado de firmas de cada firmante',
                          '💾 Almacenamiento seguro en la nube con respaldos automáticos',
                          '🔍 Verificación automática de identidad de los firmantes',
                          '📄 Generación de anexos y modificaciones contractuales',
                          '⚖️ Cumplimiento automático con normativas legales chilenas'
                        ]
                      }
                    },
                    {
                      icon: '💰',
                      text: 'Cobros automatizados',
                      desc: 'Sistema inteligente de recordatorios y cobros de arriendos',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo automatizamos los cobros?',
                        steps: [
                          '📅 Recordatorios automáticos por email y SMS antes del vencimiento',
                          '💳 Integración con múltiples métodos de pago (transferencias, tarjetas, efectivo)',
                          '📊 Reportes detallados de pagos puntuales y morosidades por propiedad',
                          '🔄 Reintentos automáticos de cobros fallidos con diferentes métodos',
                          '📱 Aplicación móvil para propietarios con alertas en tiempo real',
                          '💰 Generación automática de recibos y comprobantes fiscales',
                          '📈 Análisis predictivo de riesgo de morosidad por arrendatario',
                          '🏦 Conexión directa con bancos para transferencias automáticas'
                        ]
                      }
                    },
                    {
                      icon: '📊',
                      text: 'Informes comerciales',
                      desc: 'Accede a reportes detallados de tus postulantes',
                      expandable: true,
                      expandedContent: {
                        title: '¿Qué incluyen nuestros informes comerciales?',
                        steps: [
                          '📈 Historial crediticio completo y capacidad de pago verificada',
                          '🔍 Referencias laborales y personales con contacto directo',
                          '📊 Análisis de riesgo personalizado con scoring automático',
                          '📋 Reportes de antecedentes penales y judiciales actualizados',
                          '💼 Información financiera consolidada (ingresos, deudas, activos)',
                          '🏠 Historial de arrendamientos anteriores con referencias',
                          '⚖️ Evaluación legal de capacidad contractual',
                          '📊 Puntaje de confiabilidad predictivo basado en IA'
                        ]
                      }
                    },
                    {
                      icon: '🔒',
                      text: 'Portal seguro de documentos',
                      desc: 'Almacenamiento seguro para toda tu documentación legal',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo aseguramos tus documentos?',
                        steps: [
                          '🔐 Encriptación de extremo a extremo con estándares bancarios',
                          '📁 Organización automática por tipo, fecha y propiedad asociada',
                          '🔍 Búsqueda inteligente con OCR para texto dentro de documentos',
                          '📤 Compartir documentos de forma segura con expiración automática',
                          '💾 Respaldos automáticos en múltiples ubicaciones geográficas',
                          '📊 Control de versiones para seguimiento de modificaciones',
                          '🔗 Integración con contratos electrónicos para firma automática',
                          '📱 Acceso móvil seguro con autenticación biométrica'
                        ]
                      }
                    },
                    {
                      icon: '🤖',
                      text: 'Chatbot inteligente',
                      desc: 'Para derivar al postulante o arrendatario hacia la plataforma',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funciona nuestro chatbot inteligente?',
                        steps: [
                          '💬 Respuestas automáticas 24/7 en español e inglés',
                          '🎯 Clasificación inteligente de consultas por intención y urgencia',
                          '🔄 Derivación automática a agentes humanos para casos complejos',
                          '📊 Análisis de satisfacción del usuario con feedback automático',
                          '🧠 Aprendizaje continuo con IA para mejorar respuestas',
                          '📱 Integración con WhatsApp, web y aplicación móvil',
                          '🔍 Base de conocimiento actualizada automáticamente',
                          '📈 Métricas detalladas de conversión y resolución de consultas'
                        ]
                      }
                    },
                    {
                      icon: '📅',
                      text: 'Agendar Visitas Flexible',
                      desc: 'Sistema inteligente de agendamiento con horarios flexibles y recordatorios automáticos',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funciona el agendamiento flexible?',
                        steps: [
                          '📱 Calendario interactivo con disponibilidad en tiempo real',
                          '🔄 Sincronización automática con Google Calendar y Outlook',
                          '📧 Confirmaciones y recordatorios automáticos por múltiples canales',
                          '⚡ Reprogramación instantánea sin conflictos de horarios',
                          '📊 Reportes de visitas realizadas, canceladas y conversiones',
                          '👥 Coordinación automática entre propietarios, corredores y postulantes',
                          '🏠 Integración con tours virtuales para visitas previas',
                          '📱 Aplicación móvil con notificaciones push y GPS'
                        ]
                      }
                    },
                    {
                      icon: '📈',
                      text: 'Información detallada del rendimiento',
                      desc: 'Análisis completo con visualizaciones, postulaciones, ofertas y referencias de mercado',
                      expandable: true,
                      expandedContent: {
                        title: '¿Qué métricas incluye el análisis de rendimiento?',
                        steps: [
                          '📊 Gráficos interactivos de conversión por período y propiedad',
                          '🏠 Estadísticas detalladas por tipo de propiedad y ubicación',
                          '⏱️ Tiempos promedio de arriendo desde publicación hasta contrato',
                          '💰 Comparativas de precios vs mercado con datos actualizados',
                          '📈 Tendencias y pronósticos futuros basados en IA',
                          '👥 Análisis demográfico de postulantes por propiedad',
                          '📊 ROI detallado por inversión en marketing inmobiliario',
                          '🔍 Identificación de patrones de éxito y áreas de mejora'
                        ]
                      }
                    },
                    {
                      icon: '🏦',
                      text: 'Traspaso ágil con bancos',
                      desc: 'Genera transferencias rápidas y seguras de información financiera con entidades bancarias para compraventas',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo facilitamos las transferencias bancarias?',
                        steps: [
                          '🔗 Conexión directa API con principales bancos chilenos',
                          '⚡ Transferencias instantáneas entre cuentas verificadas',
                          '📋 Generación automática de comprobantes fiscales y bancarios',
                          '🔒 Protocolos de seguridad bancaria estándar PCI DSS',
                          '📊 Seguimiento en tiempo real de todas las transacciones',
                          '💰 Integración con notarios para validación de pagos',
                          '📱 Aplicación móvil para aprobación de transferencias',
                          '📈 Reportes financieros detallados de operaciones completadas'
                        ]
                      }
                    },
                    {
                      icon: '🏠',
                      text: 'Publicación inteligente de propiedades',
                      desc: 'Publica tus propiedades en múltiples plataformas de manera automática y optimizada',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funciona la publicación inteligente?',
                        steps: [
                          '📸 Optimización automática de fotos con IA para mejor calidad',
                          '🏷️ Etiquetas inteligentes generadas automáticamente por algoritmos',
                          '🌐 Distribución simultánea en más de 50 plataformas inmobiliarias',
                          '📈 Posicionamiento SEO automático con palabras clave optimizadas',
                          '📊 Análisis en tiempo real de engagement y visualizaciones',
                          '🔄 Actualización automática de precios y disponibilidad',
                          '🎯 Targeting específico por zona geográfica y tipo de comprador',
                          '📈 Reportes detallados de conversiones por plataforma'
                        ]
                      }
                    }
                  ].map((service) => (
                    <div key={service.text}>
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => service.expandable && setExpandedService(expandedService === service.text ? null : service.text)}
                        className={`group bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all duration-300 ${service.expandable ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <motion.span
                            className="text-2xl flex-shrink-0"
                            whileHover={{ scale: 1.3, rotate: 10 }}
                          >
                            {service.icon}
                          </motion.span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                {service.text}
                              </h4>
                              {service.expandable && (
                                <motion.span
                                  animate={{ rotate: expandedService === service.text ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-gray-400 text-lg"
                                >
                                  ▼
                                </motion.span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 group-hover:text-blue-600 transition-colors">
                              {service.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Contenido expandido */}
                      {service.expandable && expandedService === service.text && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 p-6 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl border border-blue-200"
                        >
                          <h5 className="font-bold text-blue-900 mb-4 text-lg">
                            {service.expandedContent.title}
                          </h5>
                          <div className="space-y-3">
                            {service.expandedContent.steps.map((step, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 text-gray-700"
                              >
                                <span className="text-sm">{step}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
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
                      Para Compradores y Vendedores
                    </h3>
                    <p className="text-gray-600">Herramientas completas para comprar, vender y gestionar propiedades</p>
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
                    {
                      icon: '🔍',
                      text: 'Postulación fácil',
                      desc: 'Proceso simplificado para postular a propiedades de tu interés',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo simplificamos las postulaciones?',
                        steps: [
                          '🔗 Enlaces directos de postulación en cada anuncio de propiedad',
                          '📝 Formularios inteligentes pre-rellenados con tus datos personales',
                          '⚡ Proceso de postulación completado en menos de 30 segundos',
                          '📤 Envío automático de tu postulación a múltiples propietarios',
                          '📊 Seguimiento inmediato del estado de tu aplicación',
                          '💬 Comunicación automática con el propietario una vez postulado',
                          '📱 Notificaciones push cuando hay actualizaciones en tu postulación',
                          '📋 Historial completo de todas tus postulaciones activas'
                        ]
                      }
                    },
                    {
                      icon: '📝',
                      text: 'Postulación simplificada',
                      desc: 'Aplica a propiedades con un solo clic',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funciona la postulación con un clic?',
                        steps: [
                          '👆 Un solo clic en el botón "Postular" de cualquier propiedad',
                          '📄 Información personal cargada automáticamente desde tu perfil',
                          '🔄 Postulación simultánea a propiedades similares recomendadas',
                          '✅ Confirmación visual inmediata de postulación exitosa',
                          '📧 Notificación automática enviada al propietario/corredor',
                          '🎯 Sistema inteligente que califica tu perfil automáticamente',
                          '📊 Puntaje de coincidencia con los requisitos del propietario',
                          '🔍 Búsqueda automática de propiedades compatibles con tu perfil'
                        ]
                      }
                    },
                    {
                      icon: '❤️',
                      text: 'Sistema de favoritos',
                      desc: 'Guarda y organiza tus propiedades preferidas',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo organizamos tus favoritos?',
                        steps: [
                          '❤️ Guardado instantáneo con un solo clic en el corazón',
                          '📂 Carpetas personalizadas organizadas por tipo de propiedad',
                          '🔍 Búsqueda inteligente dentro de tu lista de favoritos',
                          '📊 Comparación visual lado a lado de hasta 4 propiedades',
                          '🔔 Alertas automáticas cuando cambian precios o disponibilidad',
                          '📱 Sincronización perfecta entre web y aplicación móvil',
                          '📈 Análisis de mercado de tus propiedades favoritas',
                          '💾 Respaldos automáticos para nunca perder tus selecciones'
                        ]
                      }
                    },
                    {
                      icon: '📈',
                      text: 'Seguimiento en tiempo real',
                      desc: 'Monitorea el estado de todas tus postulaciones',
                      expandable: true,
                      expandedContent: {
                        title: '¿Qué incluye el seguimiento en tiempo real?',
                        steps: [
                          '👀 Estado actualizado automáticamente de cada postulación',
                          '📊 Barra de progreso visual con porcentajes de avance',
                          '🔔 Notificaciones push instantáneas de cualquier cambio',
                          '📅 Historial cronológico completo de todas las interacciones',
                          '📈 Estadísticas detalladas de éxito en tus postulaciones',
                          '🎯 Recomendaciones personalizadas basadas en tu historial',
                          '📱 Dashboard móvil con widgets personalizables',
                          '🔄 Actualización automática cada 5 minutos sin refrescar'
                        ]
                      }
                    },
                    {
                      icon: '💬',
                      text: 'Comunicación directa',
                      desc: 'Contacta con propietarios de forma segura',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo aseguramos la comunicación directa?',
                        steps: [
                          '🔒 Mensajería encriptada de extremo a extremo con TLS 1.3',
                          '⏰ Respuestas garantizadas en menos de 24 horas hábiles',
                          '📝 Plantillas inteligentes de mensajes por tipo de consulta',
                          '📎 Compartir documentos seguros con expiración automática',
                          '📊 Registro completo y auditable de todas las conversaciones',
                          '🎯 Clasificación automática de consultas por urgencia',
                          '📱 Integración nativa con WhatsApp y SMS',
                          '🗣️ Soporte multilingüe español/inglés/portugués'
                        ]
                      }
                    },
                    {
                      icon: '📁',
                      text: 'Portafolio personal',
                      desc: 'Crea tu perfil completo de postulante',
                      expandable: true,
                      expandedContent: {
                        title: '¿Qué incluye tu portafolio personal?',
                        steps: [
                          '📋 Información personal completa con validación automática',
                          '💼 Historial laboral verificado con referencias directas',
                          '💰 Información financiera certificada por entidades autorizadas',
                          '🏠 Preferencias detalladas de vivienda (ubicación, presupuesto, amenities)',
                          '📊 Puntaje de confiabilidad automático basado en múltiples factores',
                          '📄 Documentos importantes organizados por categorías',
                          '🔍 Perfil público optimizado para aparecer en búsquedas',
                          '📈 Estadísticas de visibilidad y engagement de tu perfil'
                        ]
                      }
                    },
                    {
                      icon: '📅',
                      text: 'Agendador de Visitas Flexible e Intuitivo',
                      desc: 'Programa visitas a propiedades con horarios personalizados y recordatorios automáticos',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo funciona el agendador intuitivo?',
                        steps: [
                          '📅 Calendario visual interactivo con disponibilidad en tiempo real',
                          '⚡ Reserva confirmada instantáneamente sin aprobación manual',
                          '🔄 Cambio de horarios libre sin penalizaciones ni conflictos',
                          '📱 Sincronización perfecta con Google Calendar y Outlook',
                          '🔔 Recordatorios automáticos por email, SMS y push notifications',
                          '📊 Reportes detallados de visitas realizadas y conversiones'
                        ]
                      }
                    },
                    {
                      icon: '💰',
                      text: 'Tasaciones comerciales automatizadas',
                      desc: 'Genera tasaciones precisas tanto para arriendo como compraventa de manera automática',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo generamos tasaciones automatizadas?',
                        steps: [
                          '📊 Análisis profundo de datos del mercado inmobiliario local',
                          '🏠 Evaluación automática de características físicas de la propiedad',
                          '📈 Tendencias históricas de precios con proyecciones futuras',
                          '🔍 Comparables automatizados de propiedades similares vendidas',
                          '📄 Reportes profesionales en PDF con gráficos detallados',
                          '💰 Tasaciones diferenciadas para arriendo y compraventa',
                          '📊 Actualización automática semanal de valores de mercado',
                          '🔬 Algoritmos de IA que consideran factores económicos externos'
                        ]
                      }
                    },
                    {
                      icon: '📋',
                      text: 'Estudios de títulos automatizados',
                      desc: 'Genera estudios completos de títulos de propiedad de forma automática y segura',
                      expandable: true,
                      expandedContent: {
                        title: '¿Qué verificamos en los estudios de títulos?',
                        steps: [
                          '📜 Historial completo de propiedad desde su origen registral',
                          '⚖️ Estado legal actual con verificación de gravámenes y embargos',
                          '🔍 Análisis exhaustivo de documentos originales certificados',
                          '📊 Evaluación detallada de riesgos jurídicos y legales',
                          '✅ Certificación digital con firma electrónica avanzada',
                          '🏛️ Verificación automática con registros del Conservador de Bienes Raíces',
                          '📋 Reporte ejecutivo con resumen de hallazgos clave',
                          '🔄 Actualización automática cuando hay cambios registrales'
                        ]
                      }
                    },
                    {
                      icon: '👥',
                      text: 'Gestión de visitas virtuales',
                      desc: 'Organiza y realiza visitas virtuales con recorridos 360° y videollamadas',
                      expandable: true,
                      expandedContent: {
                        title: '¿Cómo gestionamos las visitas virtuales?',
                        steps: [
                          '📹 Creación automática de recorridos virtuales 360° profesionales',
                          '📅 Sistema de agendamiento integrado con calendarios personales',
                          '💻 Videollamadas HD con soporte para múltiples participantes',
                          '📱 Aplicación móvil dedicada para visitas in situ con GPS',
                          '📊 Reportes detallados de interacciones y tiempo de visualización',
                          '🎯 Preguntas frecuentes automatizadas durante la visita',
                          '📝 Formularios de evaluación automática post-visita',
                          '🔄 Grabación opcional para revisión posterior de la visita'
                        ]
                      }
                    }
                  ].map((service) => (
                    <div key={service.text}>
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => service.expandable && setExpandedService(expandedService === service.text ? null : service.text)}
                        className={`group bg-gradient-to-r from-teal-50 to-transparent p-4 rounded-xl border border-teal-100 hover:border-teal-300 transition-all duration-300 ${service.expandable ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <motion.span
                            className="text-2xl flex-shrink-0"
                            whileHover={{ scale: 1.3, rotate: -10 }}
                          >
                            {service.icon}
                          </motion.span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                                {service.text}
                              </h4>
                              {service.expandable && (
                                <motion.span
                                  animate={{ rotate: expandedService === service.text ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="text-gray-400 text-lg"
                                >
                                  ▼
                                </motion.span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 group-hover:text-teal-600 transition-colors">
                              {service.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Contenido expandido */}
                      {service.expandable && expandedService === service.text && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 p-6 bg-gradient-to-r from-teal-100 to-teal-50 rounded-xl border border-teal-200"
                        >
                          <h5 className="font-bold text-teal-900 mb-4 text-lg">
                            {service.expandedContent.title}
                          </h5>
                          <div className="space-y-3">
                            {service.expandedContent.steps.map((step, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-3 text-gray-700"
                              >
                                <span className="text-sm">{step}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* TEXTO FINAL */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <motion.p
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-4"
            >
              ESOS SERVICIOS Y MUCHOS MÁS
            </motion.p>
            <motion.p
              className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed"
            >
              LA INNOVACIÓN Y LA EXPERIENCIA DE USUARIO SON NUESTROS VALORES MÁS RELEVANTES
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
      SECCIÓN 4: CONTÁCTANOS
      ═══════════════════════════════════════════════════════════════ */}
      <section id="contact-section" className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-white to-slate-50">
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

