const { TypeDataModel } = foundry.abstract;
const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;
const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * ============================================================================
 * 1. CONFIGURACIÓN CENTRALIZADA (FÁCIL DE EDITAR TRAS PLAYTESTS)
 * ============================================================================
 */
export const WINGS_CONFIG = {
  attributes: {
    might: { label: "Poder", short: "POD", description: "Fuerza física, ataques fuertes, agarres y empujes." },
    agility: { label: "Agilidad", short: "AGI", description: "Movilidad, ataques rápidos, rango e iniciativa." },
    technique: { label: "Técnica", short: "TEC", description: "Destreza, guardia y ejecución de maniobras." },
    will: { label: "Voluntad", short: "VOL", description: "Resiliencia, HP, Mitigación y habilidades de Brío." },
    wits: { label: "Intelecto", short: "INT", description: "Astucia, conocimientos y habilidades de Flujo." },
    presence: { label: "Presencia", short: "PRE", description: "Personalidad, carisma e influencia social." }
  },

  combatRules: {
    basePA: 8,
    minAttribute: -1,
    maxAttribute: 10,
    maxConfidence: 10,
    comboPACostReduction: 1,
    minPACost: 1,
    finisherBonusDamage: 6,
    comboMitigationPerHit: 2,
    comboMitigationMax: 10,
    comboConfidenceThreshold: 3,
    comboConfidenceReward: 1,
    grapplerThrowConfidenceBonus: 1,
    burlaPACost: 1,
    burlaConfidenceGain: 1,
    quiebrePACost: 2,
    rerollConfidenceCost: 1,
    cancelConfidenceCost: 1,
    parryPACost: 1,
    parryBonusDie: "1d4"
  },

  derivedStats: {
    calcMaxHP: (attrs) => 100 + (attrs.will.value * 10),
    calcVM: (attrs) => Math.max(2, 2 + attrs.agility.value),
    calcMT: (attrs) => Math.max(0, Math.floor(attrs.will.value / 2) + 2),
    calcMaxPA: (archetypeKey) => {
      const arch = WINGS_CONFIG.archetypes[archetypeKey];
      return WINGS_CONFIG.combatRules.basePA + (arch?.paBonus ?? 0);
    }
  },

  archetypes: {
    shoto: {
      label: "Shoto",
      paBonus: 1,
      extraThrowDice: 0,
      initialBonus: "+2 puntos de mejora de atributo libre (no repetir el mismo atributo).",
      passive: "+1 Punto de Acción máximo (9 PA base).",
      dice: { ligero: 6, medio: 8, pesado: 8, lanzamiento: 6 }
    },
    rushdown: {
      label: "Rushdown",
      paBonus: 0,
      extraThrowDice: 0,
      initialBonus: "+1 Agilidad y +1 en otro atributo a elección.",
      passive: "Al completar un combo: +2 al próximo ataque contra ese oponente y puedes moverte 1 casilla.",
      dice: { ligero: 10, medio: 6, pesado: 6, lanzamiento: 4 }
    },
    zooner: {
      label: "Zooner",
      paBonus: 0,
      extraThrowDice: 0,
      initialBonus: "+1 Técnica y +1 en otro atributo a elección.",
      passive: "Los Movimientos Especiales de tipo 'proyectil' cuentan como ataques de Combo.",
      dice: { ligero: 6, medio: 6, pesado: 4, lanzamiento: 6 }
    },
    grappler: {
      label: "Grappler",
      paBonus: 0,
      extraThrowDice: 1,
      initialBonus: "+1 Voluntad y +1 en otro atributo a elección.",
      passive: "+1 dado adicional de arquetipo en Lanzamientos (2d12) y +1 Confianza extra al cerrar combo con Lanzamiento.",
      dice: { ligero: 4, medio: 4, pesado: 10, lanzamiento: 12 }
    },
    footsies: {
      label: "Footsies / Poke",
      paBonus: 0,
      extraThrowDice: 0,
      initialBonus: "-1 Voluntad, +1 Agilidad.",
      passive: "Tus golpes/cortes tienen +1 casilla extra de rango.",
      dice: { ligero: 8, medio: 10, pesado: 6, lanzamiento: 4 }
    },
    heavyHitter: {
      label: "Heavy Hitter",
      paBonus: 0,
      extraThrowDice: 0,
      initialBonus: "-1 Agilidad, -1 Técnica, +2 Poder.",
      passive: "Si fallas un golpe por 3 o menos, infliges daño igual a tu Poder que la Mitigación no puede cubrir.",
      dice: { ligero: 4, medio: 10, pesado: 12, lanzamiento: 6 }
    },
    counter: {
      label: "Counter/Reversal",
      paBonus: 0,
      extraThrowDice: 0,
      initialBonus: "-1 Poder, +2 Técnica.",
      passive: "Puedes realizar un Contraataque sin costo de PA, pero sin poder hacer combos con ese contraataque.",
      dice: { ligero: 6, medio: 4, pesado: 8, lanzamiento: 8 }
    }
  },

  universalActions: {
    ligero: {
      name: "Golpe/Corte Ligero [GPL]",
      paCost: 1,
      tags: ["Activa", "Ataque", "Iniciador"],
      isAttack: true,
      archetypeDieKey: "ligero",
      atkBonus: (attrs) => Math.max(1, Math.floor(attrs.agility.value / 2)),
      dmgFlat: (attrs) => 10 + Math.floor(attrs.might.value / 2),
      effectText: (attrs) => `+${Math.max(1, Math.floor(attrs.agility.value / 2))} al ataque (mitad Agilidad, mín. 1). Inicia Combo.`
    },
    medio: {
      name: "Golpe/Corte Medio [GPM]",
      paCost: 2,
      tags: ["Activa", "Ataque", "Iniciador", "Combo"],
      isAttack: true,
      archetypeDieKey: "medio",
      atkBonus: () => 0,
      dmgFlat: (attrs) => 15 + Math.floor(attrs.might.value / 2),
      effectText: () => "Iniciador o continuación de Combo (-1 PA si estás en Combo)."
    },
    pesado: {
      name: "Golpe/Corte Pesado [GPP]",
      paCost: 2,
      tags: ["Activa", "Ataque", "Remate", "Empuje"],
      isAttack: true,
      archetypeDieKey: "pesado",
      atkBonus: () => -2,
      dmgFlat: (attrs) => 21 + attrs.might.value,
      effectText: () => "Suma Poder completo al daño (-2 al ataque). Remate: +6 daño en Combo."
    },
    lanzamiento: {
      name: "Lanzamiento [L]",
      paCost: 1,
      tags: ["Multiuso", "Ataque", "Remate", "Toque"],
      isAttack: true,
      archetypeDieKey: "lanzamiento",
      atkBonus: () => 0,
      dmgFlat: (attrs) => 20 + Math.floor(attrs.might.value / 2),
      effectText: () => "Deja 'Derribado' (no usable si ya está derribado). Remate y usable tras Parry."
    },
    carrera: {
      name: "Ataque en Carrera",
      paCost: 2,
      tags: ["Activa", "Ataque", "Empuje"],
      isAttack: true,
      archetypeDieKey: null,
      atkBonus: () => 0,
      dmgFlat: (attrs) => 12 + Math.floor(attrs.might.value / 2),
      effectText: (attrs) => `+2 casillas de mov. durante el ataque. Empuja ${Math.max(1, Math.floor(attrs.might.value / 2))} casilla(s).`
    },
    esprintar: {
      name: "Esprintar",
      paCost: 1,
      tags: ["Activa", "Utilidad", "Desplazamiento"],
      isAttack: false,
      effectText: (attrs) => `Suma tu Agilidad (+${Math.max(0, attrs.agility.value)} casillas) al movimiento de este turno.`
    }
  },

  skills: {
    actuacion: { name: "Actuación", attr: "presence", description: "Entretener y llamar la atención" },
    academia: { name: "Academia", attr: "wits", description: "Conocimientos intelectuales" },
    acrobacias: { name: "Acrobacias", attr: "agility", description: "Maniobras gimnásticas y rápidas" },
    brio: { name: "Brío", attr: "will", description: "Poderes sobrenaturales" },
    callejeo: { name: "Callejeo", attr: "presence", description: "Desenvolverse en las calles" },
    conduccion: { name: "Conducción", attr: "technique", description: "Manejar y pilotar vehículos" },
    etiqueta: { name: "Etiqueta", attr: "presence", description: "Conocer formalidades y costumbres" },
    destrezasBlandas: { name: "Destrezas Blandas", attr: "technique", description: "Competencias personales" },
    dialogo: { name: "Diálogo", attr: "presence", description: "Persuadir y transmitir ideas" },
    engano: { name: "Engaño", attr: "presence", description: "Mentir y disimular" },
    fuerzaBruta: { name: "Fuerza Bruta", attr: "might", description: "Poder físico completo" },
    flujo: { name: "Flujo", attr: "wits", description: "Magia arcana y fundamentos científicos" },
    informatica: { name: "Informática", attr: "wits", description: "Manejar electrodomésticos, red y hackeo" },
    ingenieria: { name: "Ingeniería", attr: "wits", description: "Manejo de maquinarias y artesanía" },
    introspeccion: { name: "Introspección", attr: "technique", description: "Analizar situaciones y personas" },
    investigacion: { name: "Investigación", attr: "wits", description: "Descubrir y deducir misterios" },
    intimidacion: { name: "Intimidación", attr: "presence", description: "Amedrentar a otros" },
    leyes: { name: "Leyes", attr: "wits", description: "Conocimiento de normas e instituciones" },
    medicina: { name: "Medicina", attr: "wits", description: "Tratar lesiones y conocimientos forenses" },
    rastrear: { name: "Rastrear", attr: "technique", description: "Localizar huellas, guiarse y tomar atajos" },
    resiliencia: { name: "Resiliencia", attr: "will", description: "Soportar condiciones extremas y castigos físicos" },
    sigilo: { name: "Sigilo", attr: "agility", description: "Escabullirte y viajar sin ser visto" }
  },

  specialMoveTypes: {
    inmediato: { label: "Inmediato (Activa — en tu turno)", tag: "Inmediato", maxProps: 3 },
    reactivo: { label: "Reactivo (Reacción — con gatillo)", tag: "Reactivo", maxProps: 3 },
    libre: { label: "Libre (Cualquier momento — máx. 2 props)", tag: "Libre", maxProps: 2 }
  },

  specialMoveBalanceRules: {
    minPoints: -3,
    maxPoints: 3,
    maxPropsDefault: 3,
    maxPropsLibre: 2,
    maxDuplicateProp: 2
  },

  specialMoveBalance: [
    { key: "veloz", label: "Veloz", range: "-3", min: -3, max: -3, paCost: 1, baseValue: 8 },
    { key: "agil", label: "Ágil", range: "-2 a -1", min: -2, max: -1, paCost: 2, baseValue: 12 },
    { key: "estandar", label: "Estándar", range: "0", min: 0, max: 0, paCost: 2, baseValue: 18 },
    { key: "fuerte", label: "Fuerte", range: "+1 a +2", min: 1, max: 2, paCost: 3, baseValue: 24 },
    { key: "devastador", label: "Devastador", range: "+3", min: 3, max: 3, paCost: 4, baseValue: 32 }
  ],

  specialMoveProperties: {
    // Propiedades de Área
    cono: { label: "Cono", category: "Área", points: -2, description: "Se manifiesta en un cono (requiere melee o rango)." },
    cuadrado: { label: "Cuadrado", category: "Área", points: 0, description: "Se manifiesta en un cuadrado (requiere melee o rango)." },
    linea: { label: "Línea", category: "Área", points: -1, description: "Se manifiesta en una línea." },
    rango2: { label: "Rango (2 casillas)", category: "Área", points: 0, description: "Alcance de 2 casillas o menos." },
    rango5: { label: "Rango (5 casillas)", category: "Área", points: 1, description: "Alcance de 5 casillas o menos." },
    rango10: { label: "Rango (10 casillas)", category: "Área", points: 2, description: "Alcance de 10 casillas o menos." },
    rangoGlobal: { label: "Rango (Global)", category: "Área", points: 3, description: "Alcance a cualquier casilla del mapa." },
    radio: { label: "Radio", category: "Área", points: -3, description: "Se manifiesta en un radio desde su centro." },

    // Propiedades de Potencia
    dadoMenor: { label: "Dado de arquetipo menor", category: "Potencia", points: 0, archetypeDieTier: "menor", description: "Añade tu dado de arquetipo más bajo al valor." },
    dadoIntermedio: { label: "Dado de arquetipo intermedio", category: "Potencia", points: 1, archetypeDieTier: "intermedio", description: "Añade tu dado de arquetipo intermedio al valor." },
    dadoPotente: { label: "Dado de arquetipo potente", category: "Potencia", points: 2, archetypeDieTier: "potente", description: "Añade tu dado de arquetipo más alto al valor." },
    potenciaMinima: { label: "Potencia mínima", category: "Potencia", points: -2, description: "El valor base es reducido a la mitad." },
    inofensivo: { label: "Inofensivo", category: "Potencia", points: -3, description: "No puede causar daño ni usar dados de arquetipo." },

    // Propiedades de Cualidad
    arcano: { label: "Arcano", category: "Cualidad", points: 1, skillKey: "flujo", description: "Usa el modificador de Flujo (Intelecto) al atacar." },
    enganoso: { label: "Engañoso", category: "Cualidad", points: 1, skillKey: "engano", description: "Usa el modificador de Engaño (Presencia) al atacar." },
    fortaleza: { label: "Fortaleza", category: "Cualidad", points: 1, skillKey: "resiliencia", description: "Usa Resiliencia (Voluntad). Requiere Contraataque y Defensa Absoluta." },
    raudo: { label: "Raudo", category: "Cualidad", points: 1, skillKey: "acrobacias", description: "Usa el modificador de Acrobacias (Agilidad) al atacar." },
    salvaje: { label: "Salvaje", category: "Cualidad", points: 1, skillKey: "fuerzaBruta", description: "Usa el modificador de Fuerza Bruta (Poder) al atacar." },
    sobrenatural: { label: "Sobrenatural", category: "Cualidad", points: 1, skillKey: "brio", description: "Usa el modificador de Brío (Voluntad) al atacar." },

    // Propiedades de Ejecución
    dobleGolpe: { label: "Doble Golpe", category: "Ejecución", points: -1, description: "Se divide en 2 ejecuciones con mitad de valor base y tiradas separadas." },
    triAtaque: { label: "Tri-ataque", category: "Ejecución", points: -2, description: "Se divide en 3 ejecuciones con mitad de valor base y tiradas separadas." },

    // Propiedades Defensivas
    contraataque: { label: "Contraataque", category: "Defensivas", points: 2, description: "Al ser sujeto a una tirada de ataque, interrumpes el ataque." },
    defensaAbsoluta: { label: "Defensa absoluta", category: "Defensivas", points: 3, description: "No recibes daño de ninguna fuente externa al ejecutarlo." },
    resistente: { label: "Resistente", category: "Defensivas", points: 1, description: "Reduces el daño recibido igual al valor base y sus modificadores." },

    // Propiedades de Posición
    desplazamiento2: { label: "Desplazamiento (2 casillas)", category: "Posición", points: 0, description: "Te desplazas 2 casillas disponibles." },
    desplazamiento5: { label: "Desplazamiento (5 casillas)", category: "Posición", points: 1, description: "Te desplazas 5 casillas disponibles." },
    desplazamiento10: { label: "Desplazamiento (10 casillas)", category: "Posición", points: 2, description: "Te desplazas 10 casillas disponibles." },
    desplazamientoGlobal: { label: "Desplazamiento (Global)", category: "Posición", points: 3, description: "Te desplazas a cualquier casilla desocupada del mapa." },
    intercambio: { label: "Intercambio", category: "Posición", points: 1, description: "El objetivo y tú intercambian posiciones." },

    // Propiedades Ofensivas
    azote: { label: "Azote", category: "Ofensivas", points: 0, description: "Al atinar, empujas al objetivo casillas igual a tu Poder." },
    combeable: { label: "Combeable", category: "Ofensivas", points: 1, description: "Añade los efectos de Combo al movimiento especial." },
    derribador: { label: "Derribador", category: "Ofensivas", points: 1, description: "Deja en estado Derribado al objetivo." },
    destinoSeguro: { label: "Este ataque llegará a su destino", category: "Ofensivas", points: -4, description: "Siempre atina si se cumplen las condiciones descritas." },
    iniciativa: { label: "Iniciativa", category: "Ofensivas", points: -1, description: "Añade los efectos de Iniciador al movimiento especial." },
    patearSuelo: { label: "Patear el suelo", category: "Ofensivas", points: -1, description: "Solo ejecutable contra un objetivo Derribado." },
    rematador: { label: "Rematador", category: "Ofensivas", points: 0, description: "Añade los efectos de Remate al movimiento especial." },
    rompeguardias: { label: "Rompeguardias", category: "Ofensivas", points: 2, description: "No puede ser deflectado (Parry)." },

    // Propiedades de Vitalidad
    vigor: { label: "Vigor", category: "Vitalidad", points: 1, description: "Al acertar, otorga curación igual al valor base + potencia." },
    sanador: { label: "Sanador", category: "Vitalidad", points: 2, description: "Otorga curación igual al valor base + potencia." },
    desgastante: { label: "Desgastante", category: "Vitalidad", points: -2, description: "Te quita HP igual a la mitad del valor base + mitad de potencia." }
  }
};

/**
 * ============================================================================
 * HELPERS COMPARTIDOS DE REGLAS
 * ============================================================================
 */
function formatPoints(pts) {
  return pts >= 0 ? `+${pts}` : `${pts}`;
}

function formatSignedTerm(num) {
  return num >= 0 ? `+ ${num}` : `- ${Math.abs(num)}`;
}

function getArchetypeAttackDie(archetypeKey, dieKey) {
  const arch = WINGS_CONFIG.archetypes[archetypeKey];
  if (!arch || !dieKey) return null;
  const faces = arch.dice?.[dieKey];
  if (!faces) return null;
  const count = dieKey === "lanzamiento" ? 1 + (arch.extraThrowDice || 0) : 1;
  return `${count}d${faces}`;
}

function getArchetypeTierDie(archetypeKey, tier) {
  const arch = WINGS_CONFIG.archetypes[archetypeKey];
  if (!arch) return null;
  const unique = [...new Set(Object.values(arch.dice))].sort((a, b) => a - b);
  if (!unique.length) return null;
  if (tier === "menor") return `1d${unique[0]}`;
  if (tier === "potente") return `1d${unique[unique.length - 1]}`;
  const midIdx = Math.floor((unique.length - 1) / 2);
  return `1d${unique[midIdx]}`;
}

function evaluateSpecialMoveBalance(moveType, propertyKeys, isProjectile = false) {
  const rules = WINGS_CONFIG.specialMoveBalanceRules;
  const propMap = WINGS_CONFIG.specialMoveProperties;

  let rawPoints = 0;
  const counts = {};
  const validKeys = [];

  for (const key of propertyKeys) {
    if (!key || !propMap[key]) continue;
    counts[key] = (counts[key] || 0) + 1;
    validKeys.push(key);
    rawPoints += propMap[key].points;
  }

  const clampedPoints = Math.max(rules.minPoints, Math.min(rules.maxPoints, rawPoints));
  const tier = WINGS_CONFIG.specialMoveBalance.find(
    (b) => clampedPoints >= b.min && clampedPoints <= b.max
  ) || WINGS_CONFIG.specialMoveBalance[2];

  const isInofensivo = validKeys.includes("inofensivo");
  const potenciaMinimaCount = counts.potenciaMinima || 0;
  const hitCount = validKeys.includes("triAtaque") ? 3 : (validKeys.includes("dobleGolpe") ? 2 : 1);

  let supportBase = tier.baseValue;
  if (potenciaMinimaCount > 0) {
    supportBase = Math.floor(supportBase / Math.pow(2, potenciaMinimaCount));
  }
  const effectiveBase = isInofensivo ? 0 : supportBase;
  const perHitBase = hitCount > 1 ? Math.floor(effectiveBase / 2) : effectiveBase;

  const warnings = [];
  const maxAllowed = moveType === "libre" ? rules.maxPropsLibre : rules.maxPropsDefault;
  if (validKeys.length > maxAllowed) {
    warnings.push(`Los movimientos de tipo ${WINGS_CONFIG.specialMoveTypes[moveType]?.tag || moveType} admiten máximo ${maxAllowed} propiedades.`);
  }
  for (const [key, cnt] of Object.entries(counts)) {
    if (cnt > rules.maxDuplicateProp) {
      warnings.push(`No puedes colocar '${propMap[key].label}' más de ${rules.maxDuplicateProp} veces.`);
    }
  }
  const hasDieProp = validKeys.some((k) => Boolean(propMap[k]?.archetypeDieTier));
  if (isInofensivo && hasDieProp) {
    warnings.push("'Inofensivo' no puede combinarse con propiedades que añaden dado de arquetipo.");
  }
  if (validKeys.includes("fortaleza") && (!validKeys.includes("contraataque") || !validKeys.includes("defensaAbsoluta"))) {
    warnings.push("'Fortaleza' solo puede usarse si el movimiento posee 'Contraataque' y 'Defensa absoluta'.");
  }

  const computedTags = [];
  const typeTag = WINGS_CONFIG.specialMoveTypes[moveType]?.tag;
  if (typeTag) computedTags.push(typeTag);
  computedTags.push("Especial");
  if (isProjectile) computedTags.push("Proyectil");
  if (validKeys.includes("iniciativa")) computedTags.push("Iniciador");
  if (validKeys.includes("combeable")) computedTags.push("Combo");
  if (validKeys.includes("rematador")) computedTags.push("Remate");
  if (validKeys.includes("rompeguardias")) computedTags.push("Rompeguardias");
  if (validKeys.includes("contraataque")) computedTags.push("Contraataque");
  if (validKeys.includes("inofensivo")) computedTags.push("Inofensivo");

  return {
    rawPoints,
    clampedPoints,
    isClamped: rawPoints !== clampedPoints,
    tier,
    paCost: tier.paCost,
    damageBase: effectiveBase,
    supportBase,
    perHitDamageBase: perHitBase,
    hitCount,
    isInofensivo,
    warnings,
    computedTags
  };
}

/**
 * ============================================================================
 * 2. DATA MODELS V14 (ACTORES E ÍTEMS)
 * ============================================================================
 */
function makeAttributeField(label) {
  const { minAttribute, maxAttribute } = WINGS_CONFIG.combatRules;
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, min: minAttribute, max: maxAttribute, initial: 0 }),
    label: new StringField({ initial: label })
  });
}

class WingsActorDataModel extends TypeDataModel {
  static defineSchema() {
    const { basePA, maxConfidence } = WINGS_CONFIG.combatRules;
    return {
      archetype: new StringField({ initial: "" }),
      attributes: new SchemaField({
        might: makeAttributeField(WINGS_CONFIG.attributes.might.label),
        agility: makeAttributeField(WINGS_CONFIG.attributes.agility.label),
        technique: makeAttributeField(WINGS_CONFIG.attributes.technique.label),
        will: makeAttributeField(WINGS_CONFIG.attributes.will.label),
        wits: makeAttributeField(WINGS_CONFIG.attributes.wits.label),
        presence: makeAttributeField(WINGS_CONFIG.attributes.presence.label)
      }),
      resources: new SchemaField({
        hp: new SchemaField({
          value: new NumberField({ required: true, integer: true, initial: 100 }),
          max: new NumberField({ required: true, integer: true, initial: 100 })
        }),
        pa: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: basePA }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: basePA })
        }),
        confidence: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, max: maxConfidence, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, max: maxConfidence, initial: maxConfidence })
        })
      }),
      combat: new SchemaField({
        inCombo: new BooleanField({ initial: false }),
        comboHits: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        cancelNextFinisher: new BooleanField({ initial: false }),
        sprintBonus: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        attackStat: new StringField({ initial: "technique" }),
        lastRollFormula: new StringField({ initial: "" }),
        lastRollLabel: new StringField({ initial: "" })
      })
    };
  }

  prepareDerivedData() {
    for (const [key, meta] of Object.entries(WINGS_CONFIG.attributes)) {
      if (this.attributes[key]) {
        this.attributes[key].label = meta.label;
      }
    }

    this.resources.hp.max = WINGS_CONFIG.derivedStats.calcMaxHP(this.attributes);
    this.resources.pa.max = WINGS_CONFIG.derivedStats.calcMaxPA(this.archetype);
    this.resources.confidence.max = WINGS_CONFIG.combatRules.maxConfidence;

    const baseVM = WINGS_CONFIG.derivedStats.calcVM(this.attributes);
    const sprintBonus = this.combat.sprintBonus || 0;
    const extraMitigation = this.combat.inCombo
      ? Math.min(
          WINGS_CONFIG.combatRules.comboMitigationMax,
          Math.max(0, (this.combat.comboHits - 1) * WINGS_CONFIG.combatRules.comboMitigationPerHit)
        )
      : 0;

    this.derived = {
      vm: baseVM,
      turnVM: baseVM + sprintBonus,
      mt: WINGS_CONFIG.derivedStats.calcMT(this.attributes),
      comboMitigation: extraMitigation
    };
  }
}

class WingsSpecialMoveDataModel extends TypeDataModel {
  static defineSchema() {
    return {
      moveType: new StringField({
        required: true,
        initial: "inmediato",
        choices: Object.keys(WINGS_CONFIG.specialMoveTypes)
      }),
      trigger: new StringField({ initial: "" }),
      isProjectile: new BooleanField({ initial: false }),
      properties: new ArrayField(new StringField({ blank: false }), { initial: [] }),
      paCost: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
      damageBase: new NumberField({ required: true, integer: true, min: 0, initial: 18 }),
      tags: new StringField({ initial: "Inmediato · Especial" }),
      description: new StringField({ initial: "" })
    };
  }

  prepareDerivedData() {
    const evalResult = evaluateSpecialMoveBalance(this.moveType, this.properties, this.isProjectile);
    this.paCost = evalResult.paCost;
    this.damageBase = evalResult.damageBase;
    this.supportBase = evalResult.supportBase;
    this.perHitDamageBase = evalResult.perHitDamageBase;
    this.hitCount = evalResult.hitCount;
    this.isInofensivo = evalResult.isInofensivo;
    this.computedTags = evalResult.computedTags;
    this.tags = evalResult.computedTags.join(" · ");
    this.validationWarnings = evalResult.warnings;
    this.balance = {
      ...evalResult.tier,
      rawPoints: evalResult.rawPoints,
      clampedPoints: evalResult.clampedPoints,
      isClamped: evalResult.isClamped
    };
  }
}

/**
 * ============================================================================
 * 3. CLASE ACTOR (LÓGICA DE TIRADAS, COMBOS, CONFIANZA Y ARQUETIPOS)
 * ============================================================================
 */
class WingsActor extends Actor {
  async rollAttribute(attrKey) {
    const attr = this.system.attributes[attrKey];
    if (!attr) return;
    const formula = `2d6 ${formatSignedTerm(attr.value)}`;
    const label = `Prueba de Valor: ${attr.label}`;
    const roll = await new Roll("2d6 + @mod", { mod: attr.value }).evaluate();
    await this.#recordLastRoll(formula, label);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `<strong>${label}</strong>`
    });
  }

  async rollSkill(skillKey) {
    const skill = WINGS_CONFIG.skills[skillKey];
    if (!skill) return;
    const attr = this.system.attributes[skill.attr];
    const mod = attr?.value ?? 0;
    const formula = `2d6 ${formatSignedTerm(mod)}`;
    const label = `Habilidad: ${skill.name} (${attr?.label || skill.attr})`;
    const roll = await new Roll("2d6 + @mod", { mod }).evaluate();
    await this.#recordLastRoll(formula, label);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `<strong>${label}</strong><p style="font-size:12px;color:#555;margin:2px 0 0;">${skill.description}</p>`
    });
  }

  async rollDefense(isParry = false) {
    const sys = this.system;
    const tech = sys.attributes.technique.value;
    const parryCost = WINGS_CONFIG.combatRules.parryPACost;

    if (isParry) {
      if (sys.resources.pa.value < parryCost) {
        return ui.notifications.warn(`No tienes suficientes PA para realizar un Parry (${parryCost} PA).`);
      }
      await this.update({ "system.resources.pa.value": sys.resources.pa.value - parryCost });
    }

    const formula = isParry
      ? `2d6 ${formatSignedTerm(tech)} + ${WINGS_CONFIG.combatRules.parryBonusDie}`
      : `2d6 ${formatSignedTerm(tech)}`;
    const title = isParry ? `Parry (Reacción - ${parryCost} PA)` : "Tirada de Guardia";
    const roll = await new Roll(formula).evaluate();
    await this.#recordLastRoll(formula, title);

    const counterPassive = isParry && sys.archetype === "counter"
      ? `<p style="color:#58180d;font-size:12px;"><em>Pasiva Counter/Reversal: Puedes contraatacar sin costo de PA si bloqueas (sin combos).</em></p>`
      : "";
    const extra = isParry
      ? `<p><em>Si bloqueas con éxito en rango de toque, puedes gastar 1 PA extra para Lanzamiento o Ataque en Carrera.</em></p>${counterPassive}`
      : "";

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `<strong>${title}</strong>${extra}`
    });
  }

  async useUniversalAction(actionKey) {
    const action = WINGS_CONFIG.universalActions[actionKey];
    if (!action) return;

    const sys = this.system;
    const attrs = sys.attributes;
    const inCombo = sys.combat.inCombo;

    const isIniciador = action.tags.includes("Iniciador");
    const isCombo = action.tags.includes("Combo");
    const isRemate = action.tags.includes("Remate");
    const finalCost = this.#getEffectivePACost(action.paCost, inCombo && isCombo);

    if (sys.resources.pa.value < finalCost) {
      return ui.notifications.warn(`No tienes suficientes PA. Necesitas ${finalCost} PA.`);
    }

    const effectDesc = typeof action.effectText === "function" ? action.effectText(attrs) : action.effectText;
    const tagsHtml = this.#renderTagsHtml(action.tags);

    if (!action.isAttack) {
      const updateData = {
        "system.resources.pa.value": sys.resources.pa.value - finalCost,
        "system.combat.inCombo": false,
        "system.combat.comboHits": 0,
        "system.combat.cancelNextFinisher": false
      };
      if (actionKey === "esprintar") {
        const sprintGain = Math.max(0, attrs.agility.value);
        updateData["system.combat.sprintBonus"] = (sys.combat.sprintBonus || 0) + sprintGain;
      }
      await this.update(updateData);

      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div>
          <h3 style="margin:0;">${action.name} (${finalCost} PA)</h3>
          <div style="margin:4px 0;">${tagsHtml}</div>
          <p>${effectDesc}</p>
        </div>`
      });
    }

    const archDie = action.archetypeDieKey ? getArchetypeAttackDie(sys.archetype, action.archetypeDieKey) : null;
    const baseFlatDmg = action.dmgFlat(attrs);
    const atkStatKey = sys.combat.attackStat || "technique";
    const baseAtkMod = attrs[atkStatKey]?.value ?? 0;
    const actionAtkBonus = action.atkBonus(attrs);
    const atkDisplayFormula = `2d6 ${formatSignedTerm(baseAtkMod)} ${formatSignedTerm(actionAtkBonus)}`;
    const effectHtml = `<p style="font-size:12px;color:#555;margin:4px 0 0;">${effectDesc}</p>`;

    return this.#dispatchAttackSequence({
      title: action.name,
      paCost: finalCost,
      tagsHtml,
      atkFormula: "2d6 + @base + @bonus",
      atkRollData: { base: baseAtkMod, bonus: actionAtkBonus },
      atkDisplayFormula,
      archDiceTerms: archDie ? [archDie] : [],
      flatDmg: baseFlatDmg,
      hitCount: 1,
      isAutoHit: false,
      isIniciador,
      isCombo,
      isRemate,
      isGrapplerThrow: sys.archetype === "grappler" && actionKey === "lanzamiento",
      effectHtml
    });
  }

  async useSpecialMove(itemId) {
    const item = this.items.get(itemId);
    if (!item) return;

    const sys = this.system;
    const attrs = sys.attributes;
    const mSys = item.system;
    const props = mSys.properties || [];
    const propMap = WINGS_CONFIG.specialMoveProperties;

    const isIniciador = props.includes("iniciativa");
    const isCombo = props.includes("combeable") || (sys.archetype === "zooner" && mSys.isProjectile);
    const isRemate = props.includes("rematador");
    const isInofensivo = mSys.isInofensivo || props.includes("inofensivo");
    const isAutoHit = props.includes("destinoSeguro");

    const finalCost = this.#getEffectivePACost(mSys.paCost || 1, sys.combat.inCombo && isCombo);
    if (sys.resources.pa.value < finalCost) {
      return ui.notifications.warn(`No tienes suficientes PA para ${item.name} (${finalCost} PA).`);
    }

    const tagsHtml = this.#renderTagsHtml(mSys.computedTags || [mSys.tags]);
    const propDescriptions = props
      .map((k) => propMap[k])
      .filter(Boolean)
      .map((p) => `<li><strong>${p.label}:</strong> ${p.description}</li>`)
      .join("");
    const effectHtml = [
      propDescriptions ? `<ul style="font-size:12px;margin:4px 0 4px 16px;padding:0;">${propDescriptions}</ul>` : "",
      mSys.description ? `<p style="font-size:12px;color:#555;margin:2px 0 0;">${mSys.description}</p>` : ""
    ].join("");

    if (isInofensivo) {
      const nextCombo = sys.combat.inCombo ? (isCombo || isIniciador) : isIniciador;
      const nextHits = !sys.combat.inCombo
        ? (isIniciador ? 1 : 0)
        : ((isCombo || isIniciador) ? sys.combat.comboHits : 0);

      await this.update({
        "system.resources.pa.value": sys.resources.pa.value - finalCost,
        "system.combat.inCombo": nextCombo,
        "system.combat.comboHits": nextHits,
        "system.combat.cancelNextFinisher": false
      });

      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div>
          <h3 style="margin:0;">${item.name} (${finalCost} PA)</h3>
          <div style="margin:4px 0;">${tagsHtml}</div>
          <p><strong>Valor de soporte / efecto base:</strong> ${mSys.supportBase ?? mSys.balance?.baseValue ?? mSys.damageBase}</p>
          ${effectHtml}
        </div>`
      });
    }

    const qualityProp = props.find((k) => Boolean(propMap[k]?.skillKey));
    const atkAttrKey = qualityProp
      ? WINGS_CONFIG.skills[propMap[qualityProp].skillKey]?.attr || "technique"
      : (sys.combat.attackStat || "technique");
    const atkAttrLabel = WINGS_CONFIG.attributes[atkAttrKey]?.label || atkAttrKey;
    const baseAtkMod = attrs[atkAttrKey]?.value ?? 0;

    const archDiceTerms = props
      .filter((k) => Boolean(propMap[k]?.archetypeDieTier))
      .map((k) => getArchetypeTierDie(sys.archetype, propMap[k].archetypeDieTier))
      .filter(Boolean);

    const hitCount = mSys.hitCount || 1;
    const perHitBase = mSys.perHitDamageBase ?? mSys.damageBase;

    return this.#dispatchAttackSequence({
      title: item.name,
      paCost: finalCost,
      tagsHtml,
      atkFormula: "2d6 + @base",
      atkRollData: { base: baseAtkMod },
      atkDisplayFormula: `2d6 ${formatSignedTerm(baseAtkMod)}`,
      atkStatLabel: atkAttrLabel,
      archDiceTerms,
      flatDmg: perHitBase,
      hitCount,
      isAutoHit,
      isIniciador,
      isCombo,
      isRemate,
      isGrapplerThrow: false,
      effectHtml
    });
  }

  static async rollDamageFromMessage(message) {
    const payload = message?.getFlag("wings-of-relience", "attackPayload");
    if (!payload) return;

    const actor = await fromUuid(payload.actorUuid);
    if (!actor) return ui.notifications.warn("No se encontró el personaje atacante.");
    if (!actor.isOwner) return ui.notifications.warn("No tienes permiso para tirar daño con este personaje.");

    if (!payload.wasInCombo && payload.isIniciador && !message.getFlag("wings-of-relience", "comboConfirmed")) {
      if (!actor.system.combat.inCombo) {
        await actor.update({
          "system.combat.inCombo": true,
          "system.combat.comboHits": 1,
          "system.combat.cancelNextFinisher": false
        });
      }
      if (message.isOwner) {
        await message.setFlag("wings-of-relience", "comboConfirmed", true);
      }
    }

    const dmgRoll = await new Roll(payload.dmgFormula).evaluate();
    const diceResults = dmgRoll.dice.flatMap((d) => d.results.map((r) => r.result));
    const breakdown = diceResults.length ? `${payload.dmgFormula} [${diceResults.join(", ")}]` : `${payload.dmgFormula}`;
    const mtNote = payload.extraMitigation > 0
      ? `Restar MT base +${payload.extraMitigation} del rival`
      : "Restar MT del rival";

    const damagePayload = {
      damage: dmgRoll.total,
      extraMitigation: payload.extraMitigation || 0,
      ignoreMT: false,
      sourceName: payload.actionName,
      attackerName: actor.name
    };

    const applyBtnHtml = `<div style="margin-top:6px;">
      <button type="button" data-wings-chat-action="applyDamage" style="width:100%;padding:5px 8px;background:#7f1d1d;color:#fff;border:1px solid #ff2e55;border-radius:3px;font-weight:bold;cursor:pointer;">
        Aplicar Daño al Objetivo (${dmgRoll.total} - MT)
      </button>
    </div>`;

    return dmgRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flags: { "wings-of-relience": { damagePayload } },
      flavor: `<div>
        <h3 style="margin:0;">Daño: ${payload.actionName}</h3>
        <p style="font-size:14px;margin:4px 0;"><strong>Total:</strong> <span style="color:#c0392b;font-weight:bold;">${dmgRoll.total}</span> <code>(${breakdown})</code> <em>(${mtNote})</em></p>
        ${payload.effectHtml || ""}
        ${applyBtnHtml}
      </div>`
    });
  }

  static async applyDamageToTargets({ damage, extraMitigation = 0, ignoreMT = false, sourceName = "Ataque" }) {
    const targets = game.user.targets?.size
      ? [...game.user.targets]
      : (canvas?.tokens?.controlled || []);

    if (!targets.length) {
      return ui.notifications.warn("Marca un objetivo (Target) o selecciona un token en el mapa para aplicar el daño.");
    }

    const appliedLines = [];
    for (const token of targets) {
      const targetActor = token.actor;
      if (!targetActor) continue;
      if (!targetActor.isOwner) {
        ui.notifications.warn(`Solo el DJ o propietario de ${targetActor.name} puede aplicarle daño.`);
        continue;
      }

      const baseMT = targetActor.system.derived?.mt ?? 0;
      const totalMT = ignoreMT ? 0 : baseMT + extraMitigation;
      const netDamage = Math.max(0, damage - totalMT);
      const prevHP = targetActor.system.resources.hp.value;
      const nextHP = Math.max(0, prevHP - netDamage);

      await targetActor.update({ "system.resources.hp.value": nextHP });

      const defeatNote = nextHP === 0 && prevHP > 0
        ? `<br/><strong>${targetActor.name} cae a 0 HP (Inconsciente).</strong> (+2 Confianza al atacante por derrotar oponente)`
        : "";
      const mtText = ignoreMT ? "ignora MT" : `${damage} - ${totalMT} MT`;

      appliedLines.push(
        `<li><strong>${targetActor.name}</strong> recibe <strong style="color:#c0392b;">${netDamage}</strong> de daño (${mtText}) — HP: <strong>${nextHP}/${targetActor.system.resources.hp.max}</strong>${defeatNote}</li>`
      );
    }

    if (!appliedLines.length) return;
    return ChatMessage.create({
      content: `<div>
        <h4 style="margin:0 0 4px;">Daño aplicado: ${sourceName}</h4>
        <ul style="margin:0 0 0 16px;padding:0;">${appliedLines.join("")}</ul>
      </div>`
    });
  }

  async useBurla() {
    const sys = this.system;
    const cost = WINGS_CONFIG.combatRules.burlaPACost;
    const gain = WINGS_CONFIG.combatRules.burlaConfidenceGain;

    if (sys.resources.pa.value < cost) {
      return ui.notifications.warn(`No tienes suficientes PA para Burla (${cost} PA).`);
    }

    const nextConf = Math.min(WINGS_CONFIG.combatRules.maxConfidence, sys.resources.confidence.value + gain);
    await this.update({
      "system.resources.pa.value": sys.resources.pa.value - cost,
      "system.resources.confidence.value": nextConf,
      "system.combat.inCombo": false,
      "system.combat.comboHits": 0,
      "system.combat.cancelNextFinisher": false
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div>
        <h3 style="margin:0;">Burla (${cost} PA)</h3>
        <p style="margin:4px 0;">Te mofas de tu oponente. <strong>+${gain} Confianza</strong> (Actual: <strong>${nextConf}/${WINGS_CONFIG.combatRules.maxConfidence}</strong>).</p>
      </div>`
    });
  }

  async useQuiebre() {
    const sys = this.system;
    const cost = WINGS_CONFIG.combatRules.quiebrePACost;

    if (sys.resources.pa.value < cost) {
      return ui.notifications.warn(`No tienes suficientes PA para Quiebre (${cost} PA).`);
    }

    await this.update({ "system.resources.pa.value": sys.resources.pa.value - cost });

    const brokenTargets = [];
    for (const token of game.user.targets) {
      const targetActor = token.actor;
      if (!targetActor) continue;
      brokenTargets.push(targetActor.name);
      if (targetActor.isOwner && targetActor.system.combat?.inCombo) {
        await targetActor.update({
          "system.combat.inCombo": false,
          "system.combat.comboHits": 0,
          "system.combat.cancelNextFinisher": false
        });
      }
    }

    const targetNote = brokenTargets.length
      ? `<p style="margin:4px 0;"><strong>Objetivo(s):</strong> ${brokenTargets.join(", ")}.</p>`
      : "";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div>
        <h3 style="margin:0;">Quiebre (Reacción - ${cost} PA)</h3>
        ${targetNote}
        <p style="margin:4px 0;">Rompes el combo enemigo de forma prematura, cancelando su acción actual y haciéndole perder los PA gastados.</p>
      </div>`
    });
  }

  async useReroll() {
    const sys = this.system;
    const cost = WINGS_CONFIG.combatRules.rerollConfidenceCost;

    if (sys.resources.confidence.value < cost) {
      return ui.notifications.warn(`No tienes suficiente Confianza para Re-roll (necesitas ${cost}).`);
    }

    const nextConf = Math.max(0, sys.resources.confidence.value - cost);
    await this.update({ "system.resources.confidence.value": nextConf });

    const formula = sys.combat.lastRollFormula || "2d6";
    const label = sys.combat.lastRollLabel || "Tirada (2d6)";
    const roll = await new Roll(formula).evaluate();

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `<div>
        <h3 style="margin:0;">Re-roll (-${cost} Confianza)</h3>
        <p style="margin:4px 0;"><strong>Repitiendo:</strong> ${label} | Confianza restante: <strong>${nextConf}/${WINGS_CONFIG.combatRules.maxConfidence}</strong></p>
        <p style="font-size:12px;color:#555;margin:0;"><em>Debes quedarte con el resultado de esta nueva tirada.</em></p>
      </div>`
    });
  }

  async useCancel() {
    const sys = this.system;
    const cost = WINGS_CONFIG.combatRules.cancelConfidenceCost;

    if (sys.resources.confidence.value < cost) {
      return ui.notifications.warn(`No tienes suficiente Confianza para Cancel (necesitas ${cost}).`);
    }

    const nextConf = Math.max(0, sys.resources.confidence.value - cost);
    const currentHits = Math.max(1, sys.combat.comboHits || 0);

    await this.update({
      "system.resources.confidence.value": nextConf,
      "system.combat.inCombo": true,
      "system.combat.comboHits": currentHits,
      "system.combat.cancelNextFinisher": sys.combat.inCombo
    });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<div>
        <h3 style="margin:0;">Cancel (-${cost} Confianza)</h3>
        <p style="margin:4px 0;">¡Remate cancelado! <strong>En Combo</strong> se mantiene activo (Golpes acumulados: <strong>${currentHits}</strong>).</p>
        <p style="font-size:12px;color:#555;margin:0;">Confianza restante: <strong>${nextConf}/${WINGS_CONFIG.combatRules.maxConfidence}</strong>.</p>
      </div>`
    });
  }

  #getEffectivePACost(baseCost, applyComboDiscount) {
    if (!applyComboDiscount) return baseCost;
    return Math.max(
      WINGS_CONFIG.combatRules.minPACost,
      baseCost - WINGS_CONFIG.combatRules.comboPACostReduction
    );
  }

  async #applyAttackSpendAndCombo({ paCost, isIniciador, isCombo, isRemate, isGrapplerThrow }) {
    const sys = this.system;
    const rules = WINGS_CONFIG.combatRules;
    const wasInCombo = sys.combat.inCombo;
    const hitConfirmed = wasInCombo;

    let nextComboState = false;
    let newComboHits = 0;
    let isFinisherTriggered = false;
    let cancelConsumed = false;
    let confidenceGain = 0;
    let grapplerBonusGain = 0;

    if (wasInCombo) {
      newComboHits = (sys.combat.comboHits || 0) + 1;
      if (isRemate) {
        isFinisherTriggered = true;
        if (newComboHits >= rules.comboConfidenceThreshold) {
          confidenceGain = rules.comboConfidenceReward;
          if (isGrapplerThrow) {
            grapplerBonusGain = rules.grapplerThrowConfidenceBonus;
          }
        }
        if (sys.combat.cancelNextFinisher) {
          nextComboState = true;
          cancelConsumed = true;
        } else {
          nextComboState = false;
        }
      } else if (isCombo || isIniciador) {
        nextComboState = true;
      } else {
        nextComboState = false;
      }
    } else if (isIniciador) {
      nextComboState = true;
      newComboHits = 1;
    }

    const totalConfGain = confidenceGain + grapplerBonusGain;
    const nextConfidence = Math.min(rules.maxConfidence, sys.resources.confidence.value + totalConfGain);

    await this.update({
      "system.resources.pa.value": sys.resources.pa.value - paCost,
      "system.resources.confidence.value": nextConfidence,
      "system.combat.inCombo": nextComboState,
      "system.combat.comboHits": newComboHits,
      "system.combat.cancelNextFinisher": cancelConsumed ? false : sys.combat.cancelNextFinisher
    });

    const extraMitigation = hitConfirmed
      ? Math.min(rules.comboMitigationMax, Math.max(0, (newComboHits - 1) * rules.comboMitigationPerHit))
      : 0;

    return {
      hitConfirmed,
      newComboHits,
      extraMitigation,
      isFinisherTriggered,
      cancelConsumed,
      confidenceGain,
      grapplerBonusGain,
      nextConfidence,
      comboEnded: wasInCombo && !nextComboState
    };
  }

  #buildComboBannerHtml(comboResult) {
    if (!comboResult.hitConfirmed) return "";
    const parts = [
      `<p style="color:#1b5e20;font-weight:bold;margin:4px 0;">HIT-CONFIRM EN COMBO (Golpe #${comboResult.newComboHits}) — Conecta automáticamente sin tirada de ataque.</p>`,
      `<p style="color:#7b2415;font-size:13px;margin:2px 0;"><strong>Mitigación extra acumulada del rival:</strong> +${comboResult.extraMitigation} MT (máx. +${WINGS_CONFIG.combatRules.comboMitigationMax}).</p>`
    ];
    if (comboResult.isFinisherTriggered) {
      parts.push(`<p style="color:#d9534f;font-weight:bold;margin:4px 0;">[REMATE EN COMBO] +${WINGS_CONFIG.combatRules.finisherBonusDamage} Daño incluido</p>`);
    }
    if (comboResult.confidenceGain > 0) {
      const extraTxt = comboResult.grapplerBonusGain > 0
        ? ` (+${comboResult.grapplerBonusGain} extra por Grappler con Lanzamiento)`
        : "";
      parts.push(`<p style="color:#8e44ad;font-weight:bold;margin:4px 0;">+${comboResult.confidenceGain + comboResult.grapplerBonusGain} Confianza por combo de ${comboResult.newComboHits} golpes${extraTxt} (Total: ${comboResult.nextConfidence}/10)</p>`);
    }
    if (comboResult.cancelConsumed) {
      parts.push(`<p style="color:#b08d3c;font-weight:bold;margin:4px 0;">Cancel aplicado: el combo sigue activo.</p>`);
    }
    return parts.join("");
  }

  #buildAttackPassiveNotes(archetypeKey, attrs, comboResult) {
    const notes = [];
    if (archetypeKey === "heavyHitter" && !comboResult.hitConfirmed) {
      notes.push(`<em>Heavy Hitter:</em> Si fallas por 3 o menos, infliges <strong>${attrs.might.value}</strong> de daño inevitable (ignora MT).`);
    }
    if (archetypeKey === "footsies") {
      notes.push(`<em>Footsies/Poke:</em> +1 casilla extra de rango.`);
    }
    if (archetypeKey === "rushdown" && comboResult.comboEnded) {
      notes.push(`<em>Rushdown:</em> Al completar combo, +2 al próximo ataque contra este oponente y puedes moverte 1 casilla.`);
    }
    if (!notes.length) return "";
    return `<p style="font-size:12px;color:#58180d;margin:4px 0;">${notes.join("<br/>")}</p>`;
  }

  #renderTagsHtml(tags) {
    return tags
      .filter(Boolean)
      .map((t) => `<span style="background:#333;color:#fff;padding:1px 5px;border-radius:3px;font-size:11px;margin-right:3px;">${t}</span>`)
      .join("");
  }

  async #dispatchAttackSequence({
    title,
    paCost,
    tagsHtml,
    atkFormula,
    atkRollData,
    atkDisplayFormula,
    atkStatLabel = "",
    archDiceTerms = [],
    flatDmg = 0,
    hitCount = 1,
    isAutoHit = false,
    isIniciador = false,
    isCombo = false,
    isRemate = false,
    isGrapplerThrow = false,
    effectHtml = ""
  }) {
    const sys = this.system;
    const attrs = sys.attributes;
    const wasInCombo = sys.combat.inCombo;

    let comboResult = {
      hitConfirmed: false,
      newComboHits: 0,
      extraMitigation: 0,
      isFinisherTriggered: false,
      cancelConsumed: false,
      confidenceGain: 0,
      grapplerBonusGain: 0,
      nextConfidence: sys.resources.confidence.value,
      comboEnded: false
    };

    if (wasInCombo) {
      comboResult = await this.#applyAttackSpendAndCombo({
        paCost,
        isIniciador,
        isCombo,
        isRemate,
        isGrapplerThrow
      });
    } else {
      await this.update({ "system.resources.pa.value": sys.resources.pa.value - paCost });
    }

    const passiveHtml = this.#buildAttackPassiveNotes(sys.archetype, attrs, comboResult);
    const comboBannerHtml = this.#buildComboBannerHtml(comboResult);
    const messages = [];

    for (let i = 0; i < hitCount; i += 1) {
      const hitTitle = hitCount > 1 ? `${title} (Impacto ${i + 1}/${hitCount})` : title;
      const finisherPart = comboResult.isFinisherTriggered && i === hitCount - 1
        ? WINGS_CONFIG.combatRules.finisherBonusDamage
        : 0;
      const totalFlat = flatDmg + finisherPart;
      const dmgFormula = archDiceTerms.length
        ? `${archDiceTerms.join(" + ")} ${formatSignedTerm(totalFlat)}`
        : `${totalFlat}`;

      const attackPayload = {
        actorUuid: this.uuid,
        actionName: hitTitle,
        dmgFormula,
        extraMitigation: comboResult.extraMitigation,
        isIniciador,
        wasInCombo,
        isFinisherTriggered: comboResult.isFinisherTriggered && i === hitCount - 1,
        effectHtml
      };

      const grazeBtnHtml = !wasInCombo && sys.archetype === "heavyHitter"
        ? `<button type="button" data-wings-chat-action="applyGrazeDamage" style="padding:5px 8px;background:#3a2c22;color:#ffd166;border:1px solid #ffb703;border-radius:3px;font-weight:bold;cursor:pointer;">Fallo &le;3 (${attrs.might.value} sin MT)</button>`
        : "";

      const buttonsHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
        <button type="button" data-wings-chat-action="rollDamage" style="flex:1;padding:5px 8px;background:#111722;color:#00e5ff;border:1px solid #00e5ff;border-radius:3px;font-weight:bold;cursor:pointer;">
          Tirar Daño (${dmgFormula})
        </button>
        ${grazeBtnHtml}
      </div>`;

      if (wasInCombo) {
        const msg = await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flags: { "wings-of-relience": { attackPayload } },
          content: `<div>
            <h3 style="margin:0;">${hitTitle}${i === 0 ? ` (${paCost} PA)` : ""}</h3>
            <div style="margin:4px 0;">${tagsHtml}</div>
            ${i === 0 ? comboBannerHtml : ""}
            ${passiveHtml}
            ${effectHtml}
            ${buttonsHtml}
          </div>`
        });
        messages.push(msg);
        continue;
      }

      if (isAutoHit) {
        const msg = await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flags: { "wings-of-relience": { attackPayload } },
          content: `<div>
            <h3 style="margin:0;">${hitTitle}${i === 0 ? ` (${paCost} PA)` : ""}</h3>
            <div style="margin:4px 0;">${tagsHtml}</div>
            <p style="color:#2e7d32;font-weight:bold;margin:4px 0;">Destino Seguro: impacta automáticamente si se cumplen las condiciones.</p>
            ${passiveHtml}
            ${effectHtml}
            ${buttonsHtml}
          </div>`
        });
        messages.push(msg);
        continue;
      }

      const atkRoll = await new Roll(atkFormula, atkRollData).evaluate();
      if (i === 0) await this.#recordLastRoll(atkDisplayFormula, title);

      const statLabelNote = atkStatLabel ? ` <em>(${atkStatLabel})</em>` : "";
      const msg = await atkRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flags: { "wings-of-relience": { attackPayload } },
        flavor: `<div>
          <h3 style="margin:0;">Tirada de Ataque: ${hitTitle}${i === 0 ? ` (${paCost} PA)` : ""}${statLabelNote}</h3>
          <div style="margin:4px 0;">${tagsHtml}</div>
          ${passiveHtml}
          ${effectHtml}
          ${buttonsHtml}
        </div>`
      });
      messages.push(msg);
    }

    return messages.length === 1 ? messages[0] : messages;
  }

  async #recordLastRoll(formula, label) {
    await this.update({
      "system.combat.lastRollFormula": formula,
      "system.combat.lastRollLabel": label
    });
  }
}

/**
 * ============================================================================
 * 4. HOJA DE PERSONAJE V2 (FOUNDRY V14)
 * ============================================================================
 */
class WingsActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["wings", "sheet", "actor"],
    tag: "form",
    position: { width: 820, height: 760 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      rollAttr: WingsActorSheet.#onRollAttr,
      rollSkill: WingsActorSheet.#onRollSkill,
      rollGuard: WingsActorSheet.#onRollGuard,
      rollParry: WingsActorSheet.#onRollParry,
      useAction: WingsActorSheet.#onUseAction,
      useBurla: WingsActorSheet.#onUseBurla,
      useQuiebre: WingsActorSheet.#onUseQuiebre,
      useReroll: WingsActorSheet.#onUseReroll,
      useCancel: WingsActorSheet.#onUseCancel,
      resetPA: WingsActorSheet.#onResetPA,
      createSpecial: WingsActorSheet.#onCreateSpecial,
      useSpecial: WingsActorSheet.#onUseSpecial,
      editItem: WingsActorSheet.#onEditItem,
      deleteItem: WingsActorSheet.#onDeleteItem
    }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "Overview" },
        { id: "combat", label: "Combate" }
      ],
      initial: "overview"
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/wings-of-relience/templates/actor-sheet.hbs",
      scrollable: [".wor"]
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;
    const attrs = sys.attributes;

    context.actor = this.document;
    context.system = sys;
    context.tabs = this._prepareTabs("primary");

    context.isAtkTechnique = sys.combat.attackStat === "technique";
    context.isAtkMight = sys.combat.attackStat === "might";
    context.isAtkAgility = sys.combat.attackStat === "agility";

    const selectedArch = sys.archetype || "";
    context.archetypeOptions = [
      { value: "", label: "— Seleccionar Arquetipo —", selected: selectedArch === "" },
      ...Object.entries(WINGS_CONFIG.archetypes).map(([key, arch]) => ({
        value: key,
        label: arch.label,
        selected: selectedArch === key
      }))
    ];

    const activeArch = WINGS_CONFIG.archetypes[selectedArch] || null;
    context.activeArchetype = activeArch
      ? {
          ...activeArch,
          diceDisplay: {
            ligero: getArchetypeAttackDie(selectedArch, "ligero"),
            medio: getArchetypeAttackDie(selectedArch, "medio"),
            pesado: getArchetypeAttackDie(selectedArch, "pesado"),
            lanzamiento: getArchetypeAttackDie(selectedArch, "lanzamiento")
          }
        }
      : null;

    context.universalActions = Object.entries(WINGS_CONFIG.universalActions).map(([key, action]) => {
      const hasComboDiscount = sys.combat.inCombo && action.tags.includes("Combo");
      const effectiveCost = hasComboDiscount
        ? Math.max(WINGS_CONFIG.combatRules.minPACost, action.paCost - WINGS_CONFIG.combatRules.comboPACostReduction)
        : action.paCost;
      const archDie = action.archetypeDieKey ? getArchetypeAttackDie(selectedArch, action.archetypeDieKey) : null;
      const dmgPreview = action.isAttack
        ? `${archDie ? `${archDie} + ` : ""}${action.dmgFlat(attrs)}${sys.combat.inCombo && action.tags.includes("Remate") ? ` + ${WINGS_CONFIG.combatRules.finisherBonusDamage}` : ""}`
        : null;

      const variant = action.tags.includes("Remate")
        ? "finisher"
        : (action.tags.includes("Combo") ? "combo" : (action.isAttack ? "attack" : "utility"));

      return {
        key,
        name: action.name,
        paCost: effectiveCost,
        baseCost: action.paCost,
        discounted: effectiveCost < action.paCost,
        variant,
        tags: action.tags,
        dmgPreview,
        effectText: typeof action.effectText === "function" ? action.effectText(attrs) : action.effectText
      };
    });

    context.hpPercent = Math.max(0, Math.min(100, Math.round((sys.resources.hp.value / Math.max(1, sys.resources.hp.max)) * 100)));
    context.paPercent = Math.max(0, Math.min(100, Math.round((sys.resources.pa.value / Math.max(1, sys.resources.pa.max)) * 100)));
    context.confidencePercent = Math.max(0, Math.min(100, Math.round((sys.resources.confidence.value / Math.max(1, sys.resources.confidence.max)) * 100)));
    context.paSegments = Array.from({ length: Math.max(1, sys.resources.pa.max) }, (_, i) => ({
      active: i < sys.resources.pa.value
    }));
    context.confidenceSegments = Array.from({ length: WINGS_CONFIG.combatRules.maxConfidence }, (_, i) => ({
      active: i < sys.resources.confidence.value
    }));

    context.skillsList = Object.entries(WINGS_CONFIG.skills).map(([key, skill]) => {
      const mod = attrs[skill.attr]?.value ?? 0;
      return {
        key,
        name: skill.name,
        attrShort: WINGS_CONFIG.attributes[skill.attr]?.short || skill.attr,
        modDisplay: mod >= 0 ? `+${mod}` : `${mod}`,
        description: skill.description
      };
    });

    context.specialMoves = this.document.items
      .filter((i) => i.type === "specialMove")
      .map((item) => {
        const isZoonerCombo = selectedArch === "zooner" && item.system.isProjectile;
        const isComboMove = item.system.properties?.includes("combeable") || isZoonerCombo;
        const effectiveCost = sys.combat.inCombo && isComboMove
          ? Math.max(WINGS_CONFIG.combatRules.minPACost, item.system.paCost - WINGS_CONFIG.combatRules.comboPACostReduction)
          : item.system.paCost;
        return {
          id: item.id,
          name: item.name,
          system: item.system,
          effectiveCost,
          discounted: effectiveCost < item.system.paCost
        };
      });

    context.combatRules = WINGS_CONFIG.combatRules;
    return context;
  }

  _prepareSubmitData(event, form, formData, updateData = {}) {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    if (data.system?.combat && "inCombo" in data.system.combat && !data.system.combat.inCombo) {
      data.system.combat.comboHits = 0;
      data.system.combat.cancelNextFinisher = false;
    }
    if (data.system?.archetype !== undefined && data.system.archetype !== this.document.system.archetype) {
      const curPA = this.document.system.resources.pa;
      if (curPA.value === curPA.max) {
        data.system.resources = data.system.resources || {};
        data.system.resources.pa = data.system.resources.pa || {};
        data.system.resources.pa.value = WINGS_CONFIG.derivedStats.calcMaxPA(data.system.archetype);
      }
    }
    return data;
  }

  static async #onRollAttr(event, target) {
    await this.document.rollAttribute(target.dataset.attr);
  }

  static async #onRollSkill(event, target) {
    await this.document.rollSkill(target.dataset.skill);
  }

  static async #onRollGuard() {
    await this.document.rollDefense(false);
  }

  static async #onRollParry() {
    await this.document.rollDefense(true);
  }

  static async #onUseAction(event, target) {
    await this.document.useUniversalAction(target.dataset.actionKey);
  }

  static async #onUseBurla() {
    await this.document.useBurla();
  }

  static async #onUseQuiebre() {
    await this.document.useQuiebre();
  }

  static async #onUseReroll() {
    await this.document.useReroll();
  }

  static async #onUseCancel() {
    await this.document.useCancel();
  }

  static async #onResetPA() {
    await this.document.update({
      "system.resources.pa.value": this.document.system.resources.pa.max,
      "system.combat.inCombo": false,
      "system.combat.comboHits": 0,
      "system.combat.cancelNextFinisher": false,
      "system.combat.sprintBonus": 0
    });
  }

  static async #onCreateSpecial() {
    const created = await this.document.createEmbeddedDocuments("Item", [{
      name: "Nuevo Movimiento Especial",
      type: "specialMove",
      system: {
        moveType: "inmediato",
        trigger: "",
        isProjectile: false,
        properties: [],
        description: ""
      }
    }]);
    if (created?.[0]?.sheet) {
      created[0].sheet.render(true);
    }
  }

  static async #onUseSpecial(event, target) {
    await this.document.useSpecialMove(target.dataset.itemId);
  }

  static async #onEditItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item?.sheet) item.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await item.delete();
  }
}

/**
 * ============================================================================
 * 5. HOJA DE MOVIMIENTO ESPECIAL V2 (FOUNDRY V14)
 * ============================================================================
 */
class WingsSpecialMoveSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["wings", "sheet", "item", "special-move"],
    tag: "form",
    position: { width: 640, height: 680 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    sheet: {
      template: "systems/wings-of-relience/templates/special-move-sheet.hbs",
      scrollable: [".wor"]
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sys = this.document.system;
    const props = sys.properties || [];
    const maxSlots = sys.moveType === "libre"
      ? WINGS_CONFIG.specialMoveBalanceRules.maxPropsLibre
      : WINGS_CONFIG.specialMoveBalanceRules.maxPropsDefault;

    context.item = this.document;
    context.system = sys;
    context.isReactive = sys.moveType === "reactivo";
    context.isLibre = sys.moveType === "libre";
    context.hasMultiHit = (sys.hitCount || 1) > 1;
    context.maxSlots = maxSlots;

    context.moveTypeOptions = Object.entries(WINGS_CONFIG.specialMoveTypes).map(([key, meta]) => ({
      value: key,
      label: meta.label,
      selected: sys.moveType === key
    }));

    const categoryOrder = [...new Set(Object.values(WINGS_CONFIG.specialMoveProperties).map((p) => p.category))];

    context.propertySlots = Array.from({ length: maxSlots }, (_, idx) => {
      const selectedKey = props[idx] || "";
      const categories = categoryOrder.map((cat) => ({
        category: cat,
        options: Object.entries(WINGS_CONFIG.specialMoveProperties)
          .filter(([, meta]) => meta.category === cat)
          .map(([key, meta]) => ({
            key,
            label: `${meta.label} (${formatPoints(meta.points)})`,
            selected: selectedKey === key
          }))
      }));
      return {
        index: idx,
        slotNumber: idx + 1,
        fieldName: `propSlot${idx}`,
        selectedKey,
        categories
      };
    });

    context.selectedPropertyDetails = props
      .map((key) => {
        const meta = WINGS_CONFIG.specialMoveProperties[key];
        return meta ? { key, label: meta.label, category: meta.category, points: formatPoints(meta.points), description: meta.description } : null;
      })
      .filter(Boolean);

    context.balanceTiers = WINGS_CONFIG.specialMoveBalance.map((tier) => ({
      ...tier,
      active: sys.balance?.key === tier.key
    }));

    context.rawPointsFormatted = formatPoints(sys.balance?.rawPoints ?? 0);
    context.clampedPointsFormatted = formatPoints(sys.balance?.clampedPoints ?? 0);
    return context;
  }

  _prepareSubmitData(event, form, formData, updateData = {}) {
    const data = super._prepareSubmitData(event, form, formData, updateData);
    const raw = formData.object;
    const nextMoveType = data.system?.moveType || this.document.system.moveType;
    const maxProps = nextMoveType === "libre"
      ? WINGS_CONFIG.specialMoveBalanceRules.maxPropsLibre
      : WINGS_CONFIG.specialMoveBalanceRules.maxPropsDefault;

    const rawSlots = [raw.propSlot0, raw.propSlot1, raw.propSlot2];
    delete data.propSlot0;
    delete data.propSlot1;
    delete data.propSlot2;

    const counts = {};
    const cleanedProps = [];
    let warnedDuplicate = false;

    for (const key of rawSlots) {
      if (!key || !WINGS_CONFIG.specialMoveProperties[key]) continue;
      if (cleanedProps.length >= maxProps) break;
      counts[key] = (counts[key] || 0) + 1;
      if (counts[key] > WINGS_CONFIG.specialMoveBalanceRules.maxDuplicateProp) {
        warnedDuplicate = true;
        continue;
      }
      cleanedProps.push(key);
    }

    if (warnedDuplicate) {
      ui.notifications.warn("No puedes colocar la misma propiedad más de 2 veces en un Movimiento Especial.");
    }

    data.system = data.system || {};
    data.system.properties = cleanedProps;
    return data;
  }
}

/**
 * ============================================================================
 * 6. HOOKS DE INICIO Y TURNOS DE COMBATE
 * ============================================================================
 */
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = WingsActor;
  CONFIG.Actor.dataModels = {
    character: WingsActorDataModel,
    npc: WingsActorDataModel
  };
  CONFIG.Item.dataModels = {
    specialMove: WingsSpecialMoveDataModel,
    item: WingsSpecialMoveDataModel
  };

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    "wings-of-relience",
    WingsActorSheet,
    { makeDefault: true }
  );

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Item,
    "wings-of-relience",
    WingsSpecialMoveSheet,
    { types: ["specialMove"], makeDefault: true, label: "Movimiento Especial (Wings)" }
  );
});

Hooks.on("updateCombat", async (combat, updateData) => {
  if (!game.user.isGM) return;
  if (!("turn" in updateData) && !("round" in updateData)) return;

  const combatant = combat.combatant;
  if (!combatant?.actor) return;

  // Confianza NO se resetea entre turnos ni sesiones.
  await combatant.actor.update({
    "system.resources.pa.value": combatant.actor.system.resources.pa.max,
    "system.combat.inCombo": false,
    "system.combat.comboHits": 0,
    "system.combat.cancelNextFinisher": false,
    "system.combat.sprintBonus": 0
  });
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  const buttons = html.querySelectorAll("[data-wings-chat-action]");
  if (!buttons.length) return;

  for (const btn of buttons) {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const action = btn.dataset.wingsChatAction;

      if (action === "rollDamage") {
        await WingsActor.rollDamageFromMessage(message);
      } else if (action === "applyDamage") {
        const dmgPayload = message.getFlag("wings-of-relience", "damagePayload");
        if (dmgPayload) await WingsActor.applyDamageToTargets(dmgPayload);
      } else if (action === "applyGrazeDamage") {
        const atkPayload = message.getFlag("wings-of-relience", "attackPayload");
        if (!atkPayload) return;
        const actor = await fromUuid(atkPayload.actorUuid);
        const mightVal = actor?.system?.attributes?.might?.value ?? 0;
        await WingsActor.applyDamageToTargets({
          damage: mightVal,
          extraMitigation: 0,
          ignoreMT: true,
          sourceName: `${atkPayload.actionName} (Fallo <= 3 Heavy Hitter)`
        });
      }
    });
  }
});
