import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Documentación de Konfirmado</h1>
          <p className="text-gray-600 mt-2">Guía completa para configurar y usar tu pasarela de agendamiento</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-12">
          
          {/* Quick Start */}
          <section id="inicio">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Inicio Rápido</h2>
            <p className="text-gray-700 mb-4">
              Konfirmado te permite recibir reservas con pago por adelantado en 6 pasos simples:
            </p>
            <ol className="space-y-3 ml-6">
              <li className="text-gray-700">1️⃣ Configura tu marca (logo y colores)</li>
              <li className="text-gray-700">2️⃣ Crea tus servicios</li>
              <li className="text-gray-700">3️⃣ Agrega profesionales</li>
              <li className="text-gray-700">4️⃣ Conecta Google Calendar</li>
              <li className="text-gray-700">5️⃣ Configura pagos con Wompi</li>
              <li className="text-gray-700">6️⃣ Genera tu primer link de agendamiento</li>
            </ol>
          </section>

          {/* Branding */}
          <section id="marca">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎨 Configurar tu Marca</h2>
            <p className="text-gray-700 mb-4">
              Personaliza la apariencia de tu pasarela de agendamiento para que refleje tu marca.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">Dónde encontrar</p>
                  <p className="text-sm text-blue-800">Dashboard → Configuración → Identidad de Marca</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Logo</h3>
                <p className="text-gray-700 text-sm">
                  Sube tu logo en formato PNG o SVG. Se mostrará en la parte superior de tu página de agendamiento.
                  Recomendado: 200x200px, fondo transparente.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Colores</h3>
                <p className="text-gray-700 text-sm">
                  <strong>Color primario:</strong> Se usa para botones y elementos destacados.<br />
                  <strong>Color secundario:</strong> Se usa para acentos y elementos secundarios.
                </p>
              </div>
            </div>
          </section>

          {/* Services */}
          <section id="servicios">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💼 Crear Servicios</h2>
            <p className="text-gray-700 mb-4">
              Los servicios son lo que ofreces a tus clientes (consultas, citas, asesorías, etc.).
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Información básica</h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">
                    <strong>Nombre:</strong> Ej: "Consulta General", "Asesoría Legal"
                  </li>
                  <li className="text-gray-700 text-sm">
                    <strong>Duración:</strong> Cuánto tiempo toma (15, 30, 60 minutos, etc.)
                  </li>
                  <li className="text-gray-700 text-sm">
                    <strong>Descripción:</strong> Explica qué incluye el servicio
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Precio y cobro</h3>
                <ul className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">
                    <strong>Precio:</strong> Valor total del servicio en COP
                  </li>
                  <li className="text-gray-700 text-sm">
                    <strong>Tipo de cobro:</strong>
                    <ul className="ml-6 mt-1 space-y-1">
                      <li>• <strong>Parcial:</strong> Cobra un anticipo (ej: 25% para reservar)</li>
                      <li>• <strong>Total:</strong> Cobra el 100% por adelantado</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-900 font-medium">Consejo</p>
                    <p className="text-sm text-yellow-800">
                      El cobro parcial ayuda a reducir no-shows sin cobrar todo por adelantado. 
                      Recomendamos 25-30% como anticipo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Professionals */}
          <section id="profesionales">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Agregar Profesionales</h2>
            <p className="text-gray-700 mb-4">
              Los profesionales son las personas que atenderán las citas (médicos, abogados, consultores, etc.).
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Crear un profesional</h3>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Ve a Dashboard → Profesionales → Nuevo</li>
                  <li className="text-gray-700 text-sm">2. Ingresa nombre y email</li>
                  <li className="text-gray-700 text-sm">3. Selecciona qué servicios puede ofrecer</li>
                  <li className="text-gray-700 text-sm">4. Haz clic en "Guardar"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Conectar Google Calendar</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Para que el sistema muestre disponibilidad real, el profesional debe conectar su calendario:
                </p>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Haz clic en "Enviar invitación" junto al profesional</li>
                  <li className="text-gray-700 text-sm">2. El profesional recibirá un email con un link único</li>
                  <li className="text-gray-700 text-sm">3. Al hacer clic, autorizará su Google Calendar</li>
                  <li className="text-gray-700 text-sm">4. El estado cambiará a "Conectado" ✅</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-900 font-medium">Importante</p>
                    <p className="text-sm text-green-800">
                      Solo leemos la disponibilidad (ocupado/libre). No vemos detalles de eventos privados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Payments */}
          <section id="pagos">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💳 Configurar Pagos (Wompi)</h2>
            <p className="text-gray-700 mb-4">
              Para recibir pagos, necesitas una cuenta de Wompi y configurar tus credenciales.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paso 1: Crear cuenta en Wompi</h3>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Ve a <a href="https://wompi.com" target="_blank" className="text-blue-600 hover:text-blue-700">wompi.com</a></li>
                  <li className="text-gray-700 text-sm">2. Regístrate como comercio</li>
                  <li className="text-gray-700 text-sm">3. Completa la verificación de tu negocio</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paso 2: Obtener credenciales</h3>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Ingresa al dashboard de Wompi</li>
                  <li className="text-gray-700 text-sm">2. Ve a Configuración → Credenciales API</li>
                  <li className="text-gray-700 text-sm">3. Copia las 4 llaves:
                    <ul className="ml-6 mt-1 space-y-1">
                      <li>• Public Key (pub_prod_...)</li>
                      <li>• Private Key (prv_prod_...)</li>
                      <li>• Events Secret</li>
                      <li>• Integrity Secret</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paso 3: Configurar en Konfirmado</h3>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Ve a Dashboard → Métodos de Pago</li>
                  <li className="text-gray-700 text-sm">2. Pega las 4 credenciales de Wompi</li>
                  <li className="text-gray-700 text-sm">3. Haz clic en "Guardar"</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-900 font-medium">Modo de prueba</p>
                    <p className="text-sm text-yellow-800">
                      Wompi tiene llaves de prueba (test) y producción (prod). Usa las de prueba primero para probar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Booking Links */}
          <section id="links">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔗 Generar Links de Agendamiento</h2>
            <p className="text-gray-700 mb-4">
              Los links de agendamiento son URLs únicas que compartes con tus clientes para que reserven.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Crear un link</h3>
                <ol className="space-y-2 ml-6">
                  <li className="text-gray-700 text-sm">1. Ve a Dashboard → Links de Agendamiento → Nuevo</li>
                  <li className="text-gray-700 text-sm">2. Dale un nombre (ej: "Campaña Facebook", "Web principal")</li>
                  <li className="text-gray-700 text-sm">3. Opcionalmente preselecciona servicio/profesional</li>
                  <li className="text-gray-700 text-sm">4. Haz clic en "Generar link"</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Compartir el link</h3>
                <p className="text-gray-700 text-sm mb-2">
                  Una vez generado, puedes compartir el link en:
                </p>
                <ul className="space-y-1 ml-6">
                  <li className="text-gray-700 text-sm">• Tu sitio web</li>
                  <li className="text-gray-700 text-sm">• Redes sociales (Instagram, Facebook)</li>
                  <li className="text-gray-700 text-sm">• WhatsApp Business</li>
                  <li className="text-gray-700 text-sm">• Emails</li>
                  <li className="text-gray-700 text-sm">• Campañas de publicidad</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">Tip</p>
                    <p className="text-sm text-blue-800">
                      Puedes crear múltiples links para diferentes campañas y ver cuál genera más reservas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User Flow */}
          <section id="flujo">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Flujo del Cliente</h2>
            <p className="text-gray-700 mb-4">
              Así es como tus clientes reservan una cita:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Selección</h4>
                  <p className="text-sm text-gray-700">Elige servicio y profesional</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Disponibilidad</h4>
                  <p className="text-sm text-gray-700">Ve horarios disponibles en tiempo real</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Datos</h4>
                  <p className="text-sm text-gray-700">Ingresa nombre, email y teléfono</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Pago</h4>
                  <p className="text-sm text-gray-700">Paga con tarjeta a través de Wompi</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Confirmación</h4>
                  <p className="text-sm text-gray-700">Recibe email de confirmación y evento en calendario</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">❓ Preguntas Frecuentes</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Cuánto cobra Konfirmado?</h3>
                <p className="text-gray-700 text-sm">
                  Konfirmado tiene planes desde $49.900/mes. Revisa tu plan actual en Dashboard → Suscripción.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Cuánto cobra Wompi por transacción?</h3>
                <p className="text-gray-700 text-sm">
                  Wompi cobra aproximadamente 3.5% + $900 por transacción. Consulta las tarifas actuales en wompi.com.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Puedo cancelar o reprogramar citas?</h3>
                <p className="text-gray-700 text-sm">
                  Sí, cada reserva incluye links de cancelación y reprogramación en el email de confirmación.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Qué pasa si el cliente no asiste?</h3>
                <p className="text-gray-700 text-sm">
                  Si cobraste un anticipo (cobro parcial), ese dinero ya está en tu cuenta. 
                  Si cobraste el total, también. Esto reduce significativamente los no-shows.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Necesito tener Google Calendar?</h3>
                <p className="text-gray-700 text-sm">
                  Sí, cada profesional necesita una cuenta de Google Calendar para que el sistema 
                  pueda verificar disponibilidad y crear eventos automáticamente.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section id="soporte">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Soporte</h2>
            <p className="text-gray-700 mb-4">
              ¿Necesitas ayuda? Estamos aquí para ti:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="text-gray-700">
                📧 Email: <a href="mailto:support@konfirmado.com" className="text-blue-600 hover:text-blue-700">support@konfirmado.com</a>
              </li>
              <li className="text-gray-700">
                🎥 Video tutorial: <a href="https://www.youtube.com/watch?v=RDIKqV7DB8Iwg" target="_blank" className="text-blue-600 hover:text-blue-700">Ver en YouTube</a>
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}
