export const questions = [
  {
    level: 1,
    prize: "$100",
    type: "concepto",
    text: "¿Qué busca principalmente la integridad científica?",
    options: [
      "Publicar más rápido",
      "Obtener resultados positivos",
      "Producir conocimiento confiable de forma honesta y responsable",
      "Evitar cualquier error"
    ],
    correctIndex: 2,
    explanation: "La integridad científica busca que el conocimiento se produzca de manera honesta, responsable, transparente y confiable."
  },
  {
    level: 2,
    prize: "$200",
    type: "concepto",
    text: "¿Cuál es la diferencia principal entre fabricación y falsificación?",
    options: [
      "Son exactamente lo mismo",
      "Fabricar es inventar datos; falsificar es manipular datos existentes",
      "Fabricar es plagiar y falsificar es copiar",
      "Falsificar es cometer un error accidental"
    ],
    correctIndex: 1,
    explanation: "Fabricación significa inventar datos o resultados. Falsificación significa alterar, omitir o manipular datos que sí existen."
  },
  {
    level: 3,
    prize: "$300",
    type: "concepto",
    text: "¿Qué es plagio?",
    options: [
      "Corregir un resultado después de detectar un error",
      "Repetir un experimento para confirmar un hallazgo",
      "Usar ideas, palabras, métodos o resultados ajenos sin dar reconocimiento",
      "Declarar un conflicto de interés"
    ],
    correctIndex: 2,
    explanation: "El plagio consiste en apropiarse de ideas, palabras, métodos o resultados de otra persona sin el reconocimiento correspondiente."
  },
  {
    level: 4,
    prize: "$500",
    type: "concepto",
    text: "¿Qué implica ser autor de una publicación científica?",
    options: [
      "Solo recibir reconocimiento",
      "Haber financiado el proyecto",
      "Recibir crédito y asumir responsabilidad por el trabajo",
      "Ser jefe del laboratorio"
    ],
    correctIndex: 2,
    explanation: "La autoría implica tanto reconocimiento como responsabilidad sobre la integridad del trabajo publicado."
  },
  {
    level: 5,
    prize: "$1.000",
    type: "concepto",
    text: "¿Qué es un conflicto de interés?",
    options: [
      "Una discusión entre dos investigadores",
      "Una situación donde un interés secundario puede influir sobre la responsabilidad principal",
      "Un error metodológico",
      "Una forma de plagio"
    ],
    correctIndex: 1,
    explanation: "Un conflicto de interés aparece cuando un interés secundario puede influir —o parecer influir— sobre la responsabilidad principal del investigador."
  },
  {
    level: 6,
    prize: "$2.000",
    type: "caso farmacéutico",
    text: "Una compañía farmacéutica reporta 120 pacientes en un ensayo, aunque realmente solo participaron 95. ¿Qué conducta representa?",
    options: [
      "Falsificación",
      "Fabricación",
      "Plagio",
      "Conflicto de interés"
    ],
    correctIndex: 1,
    explanation: "Se están inventando participantes que nunca existieron en el estudio; por eso corresponde a fabricación de datos."
  },
  {
    level: 7,
    prize: "$4.000",
    type: "caso farmacéutico",
    text: "Durante el análisis de un medicamento, un investigador elimina deliberadamente varios eventos adversos porque empeoran los resultados del producto. ¿Qué ocurrió?",
    options: [
      "Fabricación",
      "Falsificación",
      "Error metodológico involuntario",
      "Autoría fantasma"
    ],
    correctIndex: 1,
    explanation: "Los datos existían, pero fueron ocultados deliberadamente para cambiar la interpretación del estudio: eso es falsificación."
  },
  {
    level: 8,
    prize: "$8.000",
    type: "caso farmacéutico",
    text: "Un investigador utiliza parte del protocolo desarrollado por otro grupo sin citarlo ni reconocer su autoría. Esto corresponde a…",
    options: [
      "Fabricación",
      "Conflicto de interés",
      "Plagio",
      "Sesgo de publicación"
    ],
    correctIndex: 2,
    explanation: "Usar un método o protocolo ajeno sin reconocimiento puede constituir plagio."
  },
  {
    level: 9,
    prize: "$16.000",
    type: "caso farmacéutico",
    text: "El director médico de una empresa pide aparecer como autor de un artículo, aunque no participó sustancialmente en el estudio. Esto es…",
    options: [
      "Autoría fantasma",
      "Autoría honoraria",
      "Plagio",
      "Fabricación"
    ],
    correctIndex: 1,
    explanation: "La autoría honoraria ocurre cuando se incluye como autor a alguien que no cumple los criterios de contribución y responsabilidad."
  },
  {
    level: 10,
    prize: "$32.000",
    type: "caso farmacéutico",
    text: "Una investigadora participó de manera importante en el diseño y análisis de un ensayo, pero la empresa decide excluirla de la publicación. Esto representa…",
    options: [
      "Autoría fantasma",
      "Autoría honoraria",
      "Conflicto financiero",
      "Falsificación"
    ],
    correctIndex: 0,
    explanation: "Excluir de la autoría a una persona que hizo una contribución sustancial es un ejemplo de autoría fantasma."
  },
  {
    level: 11,
    prize: "$64.000",
    type: "caso farmacéutico",
    text: "Un investigador posee acciones de la compañía cuyo medicamento está evaluando. ¿Cuál es la interpretación más adecuada?",
    options: [
      "Ya cometió fraude",
      "El estudio debe cancelarse automáticamente",
      "Existe un conflicto de interés que debe declararse y gestionarse",
      "No existe ningún problema mientras los datos sean correctos"
    ],
    correctIndex: 2,
    explanation: "El conflicto no demuestra fraude por sí mismo, pero debe declararse y gestionarse para proteger la independencia de la investigación."
  },
  {
    level: 12,
    prize: "$125.000",
    type: "caso farmacéutico",
    text: "Diez estudios evalúan un medicamento. Tres muestran beneficio y siete no. Solo se publican los tres favorables. ¿Qué problema aparece?",
    options: [
      "Plagio",
      "Autoría fantasma",
      "Sesgo de publicación",
      "Fabricación"
    ],
    correctIndex: 2,
    explanation: "Cuando los resultados favorables se publican con mayor probabilidad que los negativos, la literatura puede ofrecer una visión distorsionada de la evidencia."
  },
  {
    level: 13,
    prize: "$250.000",
    type: "caso farmacéutico",
    text: "Durante un ensayo aparecen más eventos adversos de los esperados. El patrocinador propone excluirlos del análisis principal. ¿Qué debería hacerse?",
    options: [
      "Excluirlos si son pocos",
      "Publicar únicamente los eventos graves",
      "Mantenerlos en el análisis y reportarlos de forma transparente",
      "Esperar a que otro estudio los confirme"
    ],
    correctIndex: 2,
    explanation: "Los eventos adversos son parte relevante de la evidencia y no deben ocultarse por resultar desfavorables para el producto."
  },
  {
    level: 14,
    prize: "$500.000",
    type: "caso farmacéutico",
    text: "Una farmacéutica advierte al investigador que podría perder financiación futura si publica resultados desfavorables. ¿Qué debería hacer?",
    options: [
      "Cambiar parcialmente las conclusiones",
      "Retrasar indefinidamente el artículo",
      "Mantener la independencia científica y documentar la presión recibida",
      "Dejar que la empresa decida"
    ],
    correctIndex: 2,
    explanation: "La financiación no debe condicionar la interpretación o publicación de resultados. La presión debe documentarse y gestionarse por los canales institucionales correspondientes."
  },
  {
    level: 15,
    prize: "$1.000.000",
    type: "pregunta del millón",
    text: "Una farmacéutica financia un antimicrobiano que no supera al tratamiento convencional y presenta más eventos adversos. Pide eliminar parte del análisis de seguridad, retrasar la publicación y añadir como autor a un directivo que no participó. ¿Qué debería hacer el investigador principal?",
    options: [
      "Aceptar para proteger futuros proyectos",
      "Eliminar solo algunos eventos adversos",
      "Añadir al directivo pero conservar los datos",
      "Mantener completos los resultados, respetar los criterios de autoría, declarar el papel del patrocinador y documentar cualquier presión"
    ],
    correctIndex: 3,
    explanation: "La integridad científica exige preservar los resultados completos, la independencia del estudio y los criterios legítimos de autoría, además de transparentar y documentar los conflictos y presiones."
  }
];
