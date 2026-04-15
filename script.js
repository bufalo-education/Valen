/**
 * script.js · CiberEdu SPA
 * -------------------------------------------------------
 * Arquitectura: Módulo IIFE (Immediately Invoked Function Expression)
 * - Encapsula todo el código en un scope privado.
 * - Evita contaminar el scope global (window).
 * - 'use strict' activa el modo estricto de JS:
 *     · Previene uso de variables no declaradas
 *     · Prohíbe this implícito en funciones
 *     · Captura errores silenciosos
 * -------------------------------------------------------
 */
(function () {
  'use strict';

  /* ====================================================
     MÓDULO 1: DATOS DEL QUIZ
     Fuente única de verdad para las preguntas.
     Separar datos de lógica facilita el mantenimiento:
     añadir preguntas no requiere tocar el código.
     ==================================================== */

  /**
   * @typedef {Object} QuizOption
   * @property {string} id    - Identificador único de la opción
   * @property {string} text  - Texto de la respuesta
   *
   * @typedef {Object} QuizQuestion
   * @property {string}       id       - ID único de la pregunta
   * @property {string}       text     - Enunciado de la pregunta
   * @property {QuizOption[]} options  - Array de opciones de respuesta
   * @property {string}       answer   - ID de la opción correcta
   * @property {string}       explanation - Explicación mostrada tras evaluar
   */

  /** @type {QuizQuestion[]} */
  const QUIZ_DATA = [
    {
      id: 'q1',
      text: '¿Qué técnica utilizan los atacantes para engañar a los usuarios haciéndose pasar por entidades legítimas a través de correos electrónicos o webs falsas?',
      options: [
        { id: 'a', text: 'Ransomware' },
        { id: 'b', text: 'Phishing' },
        { id: 'c', text: 'DDoS' },
        { id: 'd', text: 'SQL Injection' }
      ],
      answer: 'b',
      explanation: 'El phishing suplanta identidades legítimas para robar credenciales. Siempre verifica el remitente y la URL antes de introducir datos.'
    },
    {
      id: 'q2',
      text: '¿Cuál de las siguientes prácticas añade una segunda capa de seguridad al proceso de inicio de sesión?',
      options: [
        { id: 'a', text: 'Usar la misma contraseña en todos los servicios' },
        { id: 'b', text: 'Activar la autenticación en dos factores (2FA)' },
        { id: 'c', text: 'Desactivar las actualizaciones automáticas' },
        { id: 'd', text: 'Conectarse siempre a redes Wi-Fi abiertas' }
      ],
      answer: 'b',
      explanation: 'El 2FA exige una segunda verificación (código SMS, app TOTP) que un atacante no puede obtener solo con tu contraseña robada.'
    },
    {
      id: 'q3',
      text: '¿Qué tipo de malware cifra los archivos de la víctima y exige un pago para restaurar el acceso?',
      options: [
        { id: 'a', text: 'Spyware' },
        { id: 'b', text: 'Adware' },
        { id: 'c', text: 'Ransomware' },
        { id: 'd', text: 'Keylogger' }
      ],
      answer: 'c',
      explanation: 'El ransomware cifra los datos y pide rescate. La mejor defensa son las copias de seguridad offline regulares (regla 3-2-1).'
    },
    {
      id: 'q4',
      text: '¿Qué significa la regla "3-2-1" en ciberseguridad para copias de seguridad?',
      options: [
        { id: 'a', text: '3 contraseñas distintas, 2 de ellas largas, 1 con símbolo' },
        { id: 'b', text: '3 copias de los datos, en 2 medios distintos, 1 fuera del sitio' },
        { id: 'c', text: '3 factores de autenticación, 2 biométricos, 1 físico' },
        { id: 'd', text: '3 firewalls, 2 antivirus, 1 VPN activa siempre' }
      ],
      answer: 'b',
      explanation: 'La regla 3-2-1 es un estándar de backup: 3 copias en 2 soportes diferentes, con 1 copia en ubicación remota o nube.'
    },
    {
      id: 'q5',
      text: '¿Cuál es el objetivo principal de un ataque de Denegación de Servicio Distribuido (DDoS)?',
      options: [
        { id: 'a', text: 'Robar las credenciales de administrador del servidor' },
        { id: 'b', text: 'Instalar un troyano para acceso remoto persistente' },
        { id: 'c', text: 'Saturar un servidor con tráfico para dejarlo inaccesible' },
        { id: 'd', text: 'Cifrar los archivos del servidor para pedir rescate' }
      ],
      answer: 'c',
      explanation: 'Los DDoS inundan el servidor con miles de peticiones simultáneas desde múltiples IPs (red de bots), agotando sus recursos y haciéndolo inaccesible.'
    }
  ];

  /* ====================================================
     MÓDULO 2: ESTADO DE LA APLICACIÓN
     Objeto centralizado que guarda el estado del quiz.
     Patrón "single source of truth" para la UI.
     ==================================================== */
  const state = {
    /** @type {Object.<string, string>} Mapa { questionId: optionId } */
    answers: {},
    /** @type {boolean} Si el quiz ya fue enviado */
    submitted: false
  };

  /* ====================================================
     MÓDULO 3: UTILIDADES DOM
     Funciones auxiliares para crear nodos de forma segura.
     PRINCIPIO DE SEGURIDAD: usamos createElement + textContent
     en lugar de innerHTML para datos dinámicos.
     - innerHTML puede ejecutar HTML arbitrario → XSS
     - textContent solo inserta texto plano → seguro
     ==================================================== */

  /**
   * Crea un elemento HTML con atributos y texto de forma segura.
   * @param {string} tag        - Nombre de la etiqueta HTML
   * @param {Object} [attrs={}] - Atributos a asignar (key: value)
   * @param {string} [text=''] - Texto interno seguro (usa textContent)
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs = {}, text = '') {
    const el = document.createElement(tag);

    // Asignar atributos de forma explícita (sin eval ni setAttribute para valores de usuario)
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'htmlFor') {
        el.htmlFor = value;
      } else {
        // setAttribute es seguro para atributos conocidos del desarrollador
        el.setAttribute(key, value);
      }
    }

    // textContent es inmune a XSS: no interpreta HTML
    if (text) {
      el.textContent = text;
    }

    return el;
  }

  /**
   * Selecciona un elemento del DOM. Lanza error si no existe
   * para detectar problemas de configuración rápidamente.
   * @param {string} selector - Selector CSS
   * @returns {HTMLElement}
   */
  function $(selector) {
    const el = document.querySelector(selector);
    if (!el) {
      throw new Error(`[CiberEdu] Elemento no encontrado: "${selector}"`);
    }
    return el;
  }

  /* ====================================================
     MÓDULO 4: NAVBAR MÓVIL
     Controla el toggle del menú hamburguesa.
     ==================================================== */

  /**
   * Inicializa el comportamiento del menú hamburguesa.
   * Gestiona aria-expanded para accesibilidad.
   */
  function initNavbar() {
    const toggle = document.getElementById('navToggle');
    const menu   = document.querySelector('.nav-links');

    if (!toggle || !menu) return; // Guardia defensiva

    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);

      // Actualizar atributo ARIA para lectores de pantalla
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute(
        'aria-label',
        isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
      );
    });

    // Cerrar el menú al hacer clic en cualquier enlace (UX en móvil)
    menu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ====================================================
     MÓDULO 5: CONSTRUCCIÓN DEL QUIZ
     Genera el formulario dinámicamente desde QUIZ_DATA.
     No se usa innerHTML en ningún punto de este módulo.
     ==================================================== */

  /**
   * Construye un bloque DOM completo para una pregunta.
   * @param {QuizQuestion} question - Objeto de pregunta
   * @param {number}       index    - Índice (0-based) para mostrar número
   * @returns {HTMLElement} - El bloque <div> completo de la pregunta
   */
  function buildQuestionBlock(question, index) {
    // Contenedor principal del bloque de pregunta
    const block = createElement('div', {
      className: 'quiz-question-block',
      id: `block-${question.id}`
    });

    // Número de pregunta (ej: "Pregunta 1 / 5")
    const num = createElement('span', {
      className: 'quiz-question-num'
    }, `Pregunta ${index + 1} / ${QUIZ_DATA.length}`);

    // Enunciado
    const text = createElement('p', {
      className: 'quiz-question-text'
    }, question.text);

    // Contenedor de opciones
    const optionsContainer = createElement('div', {
      className: 'quiz-options',
      role: 'group',
      'aria-labelledby': `label-${question.id}`
    });

    // Construir cada opción como un <label> accesible
    question.options.forEach(function (option) {
      const label = createElement('label', {
        className: 'quiz-option',
        htmlFor: `${question.id}-${option.id}`
      });

      // Input radio: la accesibilidad real viene de este elemento nativo
      const input = createElement('input', {
        type: 'radio',
        name: question.id,         // Agrupar por pregunta
        id: `${question.id}-${option.id}`,
        value: option.id
      });

      // Texto de la opción (textContent → seguro contra XSS)
      const optText = createElement('span', {
        className: 'quiz-option-text'
      }, option.text);

      // Evento: actualizar estado al seleccionar
      input.addEventListener('change', function () {
        handleOptionChange(question.id, option.id, optionsContainer);
      });

      label.appendChild(input);
      label.appendChild(optText);
      optionsContainer.appendChild(label);
    });

    block.appendChild(num);
    block.appendChild(text);
    block.appendChild(optionsContainer);

    return block;
  }

  /**
   * Renderiza todas las preguntas dentro del formulario del quiz.
   * También añade el botón de envío.
   */
  function renderQuiz() {
    const form = $('#quiz-form');

    // Usar un DocumentFragment para un único repintado del DOM (performance)
    const fragment = document.createDocumentFragment();

    QUIZ_DATA.forEach(function (question, index) {
      const block = buildQuestionBlock(question, index);
      fragment.appendChild(block);
    });

    // Botón de envío
    const submitBtn = createElement('button', {
      type: 'submit',
      className: 'btn btn-submit',
      id: 'quiz-submit',
      disabled: 'true'
    }, '📊 Ver resultados');

    fragment.appendChild(submitBtn);

    // Un solo appendChild → un solo repintado del DOM
    form.appendChild(fragment);

    // Manejar el envío del formulario
    form.addEventListener('submit', handleSubmit);
  }

  /* ====================================================
     MÓDULO 6: GESTIÓN DE ESTADO DEL QUIZ
     Funciones que actualizan state y sincronizan la UI.
     ==================================================== */

  /**
   * Se llama cuando el usuario selecciona una opción.
   * Actualiza el estado y la visualización de la opción seleccionada.
   * @param {string}      questionId       - ID de la pregunta
   * @param {string}      selectedOptionId - ID de la opción seleccionada
   * @param {HTMLElement} container        - Contenedor de opciones para actualizar clases
   */
  function handleOptionChange(questionId, selectedOptionId, container) {
    if (state.submitted) return; // Bloquear cambios tras envío

    // Actualizar estado
    state.answers[questionId] = selectedOptionId;

    // Actualizar clases visuales en las opciones
    container.querySelectorAll('.quiz-option').forEach(function (label) {
      const input = label.querySelector('input[type="radio"]');
      label.classList.toggle('is-selected', input && input.value === selectedOptionId);
    });

    // Habilitar botón de envío cuando todas las preguntas estén respondidas
    updateSubmitButton();
  }

  /**
   * Habilita o deshabilita el botón de envío según si
   * todas las preguntas tienen respuesta.
   */
  function updateSubmitButton() {
    const btn = document.getElementById('quiz-submit');
    if (!btn) return;

    const allAnswered = QUIZ_DATA.every(function (q) {
      return state.answers[q.id] !== undefined;
    });

    // removeAttribute en lugar de btn.disabled = false para mayor compatibilidad
    if (allAnswered) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', 'true');
    }
  }

  /* ====================================================
     MÓDULO 7: EVALUACIÓN DEL TEST
     Compara respuestas con la clave correcta y calcula puntuación.
     ==================================================== */

  /**
   * Evalúa todas las respuestas y devuelve el número de aciertos.
   * @returns {number} - Número de respuestas correctas
   */
  function calculateScore() {
    let correct = 0;

    QUIZ_DATA.forEach(function (question) {
      if (state.answers[question.id] === question.answer) {
        correct++;
      }
    });

    return correct;
  }

  /**
   * Marca visualmente cada opción como correcta o incorrecta
   * y deshabilita todas las interacciones del formulario.
   */
  function markAnswers() {
    QUIZ_DATA.forEach(function (question) {
      const userAnswer = state.answers[question.id];
      const block = document.getElementById(`block-${question.id}`);
      if (!block) return;

      // Iterar sobre cada opción y aplicar clase correspondiente
      block.querySelectorAll('.quiz-option').forEach(function (label) {
        const input = label.querySelector('input[type="radio"]');
        if (!input) return;

        const optId = input.value;

        // Opción correcta: siempre verde
        if (optId === question.answer) {
          label.classList.add('is-correct');
          label.classList.remove('is-selected', 'is-wrong');
        }
        // Opción elegida por el usuario y es incorrecta: roja
        else if (optId === userAnswer && userAnswer !== question.answer) {
          label.classList.add('is-wrong');
          label.classList.remove('is-selected');
        }

        // Deshabilitar el input para prevenir cambios
        input.setAttribute('disabled', 'true');
      });

      // Añadir explicación de la respuesta correcta
      appendExplanation(block, question.explanation);
    });

    // Ocultar botón de envío
    const btn = document.getElementById('quiz-submit');
    if (btn) btn.style.display = 'none';
  }

  /**
   * Añade el texto de explicación al final de cada bloque de pregunta.
   * @param {HTMLElement} block       - Bloque de pregunta
   * @param {string}      explanation - Texto de la explicación
   */
  function appendExplanation(block, explanation) {
    const div = createElement('div', { className: 'quiz-explanation' });
    const icon = createElement('span', { 'aria-hidden': 'true' }, '💡 ');
    const text = createElement('span', {}, explanation);
    div.appendChild(icon);
    div.appendChild(text);

    // Estilos inline mínimos para la explicación
    div.style.marginTop     = '1rem';
    div.style.padding       = '0.75rem 1rem';
    div.style.borderRadius  = '0.5rem';
    div.style.fontSize      = '0.875rem';
    div.style.color         = '#8892b0';
    div.style.background    = 'rgba(100,255,218,0.05)';
    div.style.borderLeft    = '3px solid rgba(100,255,218,0.3)';

    block.appendChild(div);
  }

  /**
   * Construye y muestra el panel de resultado final.
   * La clase CSS aplicada varía según el porcentaje de aciertos.
   * @param {number} score - Número de respuestas correctas
   */
  function showResult(score) {
    const total      = QUIZ_DATA.length;
    const percentage = Math.round((score / total) * 100);
    const resultEl   = $('#quiz-result');

    // Determinar nivel de resultado
    let emoji, label, message, cssClass;

    if (percentage >= 80) {
      emoji    = '🏆';
      label    = '¡Excelente!';
      message  = 'Dominas los fundamentos de la ciberseguridad. ¡Sigue así!';
      cssClass = 'quiz-result--excellent';
    } else if (percentage >= 50) {
      emoji    = '📚';
      label    = 'Buen esfuerzo';
      message  = 'Vas por buen camino. Repasa los temas donde fallaste.';
      cssClass = 'quiz-result--good';
    } else {
      emoji    = '🔁';
      label    = 'Necesitas repasar';
      message  = 'Revisa el contenido del módulo antes de intentarlo de nuevo.';
      cssClass = 'quiz-result--poor';
    }

    // Construir los nodos del resultado (sin innerHTML)
    const emojiEl   = createElement('div', { className: 'result-emoji', 'aria-hidden': 'true' }, emoji);
    const scoreEl   = createElement('div', { className: 'result-score' }, `${score} / ${total}`);
    const pctEl     = createElement('div', { className: 'result-label' }, `${percentage}% · ${label}`);
    const msgEl     = createElement('p',   { className: 'result-message' }, message);

    // Botón de reintentar
    const retryBtn  = createElement('button', {
      type: 'button',
      className: 'btn btn-primary'
    }, '🔄 Reintentar');

    retryBtn.addEventListener('click', handleRetry);

    // Limpiar y poblar el contenedor de resultado
    resultEl.textContent = ''; // Vaciar de forma segura
    resultEl.appendChild(emojiEl);
    resultEl.appendChild(scoreEl);
    resultEl.appendChild(pctEl);
    resultEl.appendChild(msgEl);
    resultEl.appendChild(retryBtn);

    // Aplicar clase de color según nivel
    resultEl.className = `quiz-result ${cssClass}`;
    resultEl.classList.remove('hidden');

    // Desplazar suavemente al resultado para buena UX
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ====================================================
     MÓDULO 8: MANEJADORES DE EVENTOS PRINCIPALES
     ==================================================== */

  /**
   * Manejador del envío del formulario.
   * Previene el comportamiento por defecto, valida y evalúa.
   * @param {Event} e - Evento submit
   */
  function handleSubmit(e) {
    e.preventDefault(); // Prevenir recarga de página

    // VALIDACIÓN: Verificar que todas las preguntas están respondidas
    const unanswered = QUIZ_DATA.filter(function (q) {
      return !state.answers[q.id];
    });

    if (unanswered.length > 0) {
      // Alerta accesible: el atributo aria-live="polite" del form lo propagará
      alert(`Por favor responde todas las preguntas antes de enviar.\n(Faltan ${unanswered.length} pregunta/s)`);
      return;
    }

    // Marcar estado como enviado para bloquear cambios
    state.submitted = true;

    // Evaluar y mostrar resultados
    const score = calculateScore();
    markAnswers();
    showResult(score);
  }

  /**
   * Reinicia el quiz completamente:
   * - Limpia el estado
   * - Elimina el formulario
   * - Lo vuelve a renderizar desde cero
   */
  function handleRetry() {
    // Reiniciar estado
    state.answers   = {};
    state.submitted = false;

    // Limpiar el DOM del quiz
    const form   = $('#quiz-form');
    const result = $('#quiz-result');

    form.textContent = ''; // Eliminar todos los hijos de forma segura
    result.textContent = '';
    result.className = 'quiz-result hidden';

    // Re-renderizar
    renderQuiz();

    // Volver al inicio del test
    $('#test').scrollIntoView({ behavior: 'smooth' });
  }

  /* ====================================================
     MÓDULO 9: INICIALIZACIÓN
     Punto de entrada de la aplicación.
     Se ejecuta una vez que el DOM está listo.
     ==================================================== */

  /**
   * Función principal de arranque.
   * Orquesta la inicialización de todos los módulos.
   */
  function init() {
    try {
      initNavbar(); // Menú hamburguesa
      renderQuiz(); // Formulario del test
    } catch (err) {
      // Captura errores de configuración del DOM en desarrollo
      console.error('[CiberEdu] Error de inicialización:', err.message);
    }
  }

  // Ejecutar cuando el DOM esté completamente cargado
  // (aunque el script ya está al final del body, esta guardia
  //  lo hace seguro si se moviera al <head> con defer)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(); // Fin del IIFE — scope cerrado, nada expuesto globalmente
