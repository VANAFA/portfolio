/*
 * ============================================================
 *  PROJECTS DATA — the ONLY file you need to touch to add a
 *  new project/blog.
 *
 *  Add a new object to the PROJECTS array below. As soon as you
 *  save this file:
 *    - a new icon appears in the "My Projects" list on index.html
 *    - clicking it opens the pop-up window with your summary/photos
 *    - "To know more" opens blog.html?id=YOUR_ID, which renders
 *      itself automatically (no extra HTML file needed).
 *
 *  Shared fields (same in both languages):
 *    id      (string, required)  unique slug, used in the URL:
 *                                 blog.html?id=this-value
 *    glyph   (string)   path to the icon shown in the projects list
 *    images  (string[]) image paths for the pop-up + blog gallery
 *    tech    (string[]) short list of tags/technologies
 *    repo    (string)   optional GitHub URL, shown as a button
 *    liveUrl (string)   optional deployed URL, shown as a prominent banner
 *                        link near the top of the blog page (only for
 *                        projects that actually have one)
 *
 *  Per-language fields, inside `en` and `es`:
 *    title    project name
 *    tagline  one-liner shown under the icon & in the popup title
 *    summary  short paragraph shown in the pop-up window
 *    blog     one string per paragraph, full blog text
 *
 *  `es` is Argentinian Spanish. If you leave `es` out, the English
 *  text is used as a fallback.
 * ============================================================
 */

window.PROJECTS = [
  {
    id: "noob",
    glyph: "images/icons/joystick-32.png?v=b8e0fc2d",
    images: ["images/placeholder-noob.png?v=f6a55949"],
    tech: ["React", "TypeScript", "FastAPI", "Qwen3-4B", "LoRA"],
    repo: "https://github.com/VANAFA/llm-narrated-rpg",
    en: {
      title: "N.O.O.B.",
      tagline: "An LLM-narrated RPG, built full-stack",
      summary:
        "A chat-based narrative RPG where a fine-tuned language model plays the game master. Frontend in React/TypeScript talks to a FastAPI backend that serves Qwen3-4B as the story's narrator.",
      blog: [
        "N.O.O.B. is a chat-based, narrative-driven RPG where the game master is a language model instead of a person. The frontend is built with React and TypeScript, and it talks to a FastAPI backend that serves Qwen3-4B as the narrator, generating the world, the NPCs and the consequences of the player's choices in real time.",
        "Getting a small model to behave like a consistent, engaging game master took more than prompting. I fine-tuned Qwen3-4B with LoRA on curated narrative data, and layered activation steering on top to nudge tone and pacing at inference time without retraining.",
        "One of the harder constraints was context length: a long-running RPG session accumulates state fast (inventory, past choices, NPC relationships), and every extra token costs latency. By restructuring how history was summarized and fed back into the model, I cut context tokens by 36% without losing narrative coherence.",
        "The result is a full-stack project that touches product (what makes a game session feel alive), systems (serving an LLM with acceptable latency), and ML research (LoRA fine-tuning and activation steering) end to end."
      ]
    },
    es: {
      title: "N.O.O.B.",
      tagline: "Un RPG narrado por un LLM, hecho full-stack",
      summary:
        "Un RPG narrativo por chat donde un modelo de lenguaje afinado hace de game master. El frontend en React/TypeScript se comunica con un backend en FastAPI que sirve Qwen3-4B como narrador de la historia.",
      blog: [
        "N.O.O.B. es un RPG narrativo por chat donde el game master es un modelo de lenguaje en lugar de una persona. El frontend está hecho con React y TypeScript, y habla con un backend en FastAPI que sirve Qwen3-4B como narrador, generando el mundo, los NPCs y las consecuencias de las decisiones del jugador en tiempo real.",
        "Lograr que un modelo chico se comporte como un game master coherente y entretenido requirió bastante más que prompting. Hice fine-tuning de Qwen3-4B con LoRA sobre datos narrativos curados, y encima sumé activation steering para ajustar el tono y el ritmo en inferencia sin tener que reentrenar.",
        "Una de las restricciones más difíciles fue el largo de contexto: una partida larga acumula estado rápido (inventario, decisiones previas, relaciones con NPCs), y cada token de más cuesta latencia. Reestructurando cómo se resumía el historial y se lo devolvía al modelo, bajé un 36% los tokens de contexto sin perder coherencia narrativa.",
        "El resultado es un proyecto full-stack que toca producto (qué hace que una partida se sienta viva), sistemas (servir un LLM con latencia aceptable) e investigación en ML (fine-tuning con LoRA y activation steering) de punta a punta."
      ]
    }
  },
  {
    id: "facelab",
    glyph: "images/icons/chip_ramdrive-32.png?v=e433ab3c",
    images: ["images/placeholder-facelab.png?v=b7dbee9a"],
    tech: ["PyTorch", "Autoencoders", "Clustering", "Unsupervised"],
    en: {
      title: "Deep Learning Lab",
      tagline: "Architecture search & unsupervised learning on faces",
      summary:
        "A deep learning lab project: neural networks implemented from scratch, autoencoders and clustering pipelines used to reconstruct and interpolate between facial images.",
      blog: [
        "This project came out of a deep learning laboratory course focused on architecture search and unsupervised learning. Rather than relying on off-the-shelf layers, several core building blocks were implemented from scratch to really understand what's happening inside the network during training.",
        "The core of the project is a set of autoencoders trained on facial image datasets, used both for reconstruction and for latent-space interpolation — smoothly morphing between two faces by walking through the learned latent representation.",
        "On top of the autoencoders, unsupervised clustering pipelines were built to organize the learned latent space, grouping similar faces without any labels and using that structure to guide the interpolation quality.",
        "The project was a hands-on exploration of representation learning: how a network chooses to encode a face into a handful of numbers, and how much of that structure can be recovered and manipulated after the fact."
      ]
    },
    es: {
      title: "Deep Learning Lab",
      tagline: "Búsqueda de arquitectura y aprendizaje no supervisado sobre caras",
      summary:
        "Un proyecto de laboratorio de deep learning: redes neuronales implementadas desde cero, autoencoders y pipelines de clustering para reconstruir e interpolar entre imágenes faciales.",
      blog: [
        "Este proyecto salió de un laboratorio de deep learning enfocado en búsqueda de arquitectura y aprendizaje no supervisado. En vez de usar capas ya hechas, varios de los bloques centrales están implementados desde cero para entender de verdad qué pasa dentro de la red durante el entrenamiento.",
        "El núcleo del proyecto son autoencoders entrenados sobre datasets de imágenes faciales, usados tanto para reconstrucción como para interpolación en el espacio latente: pasar suavemente de una cara a otra recorriendo la representación aprendida.",
        "Sobre los autoencoders armé pipelines de clustering no supervisado para organizar el espacio latente, agrupando caras parecidas sin ninguna etiqueta y usando esa estructura para mejorar la calidad de la interpolación.",
        "El proyecto fue una exploración práctica del aprendizaje de representaciones: cómo una red decide codificar una cara en un puñado de números, y cuánto de esa estructura se puede recuperar y manipular después."
      ]
    }
  },
  {
    id: "road-rage",
    glyph: "images/icons/camera3-32.png?v=6ed7094c",
    images: ["images/placeholder-roadrage.png?v=948c10ee"],
    tech: ["PyTorch", "YOLOP", "OpenCV", "PID", "Comma2k19"],
    repo: "https://github.com/VANAFA/beamng-lane-keeping-yolop",
    en: {
      title: "R.O.A.D. R.A.G.E.",
      tagline: "Autonomous lane-keeping, running in real time",
      summary:
        "A computer-vision pipeline for autonomous lane keeping, combining YOLOP with a PID controller, trained on the ~100GB Comma2k19 dataset and running in real time inside the BeamNG.tech simulator.",
      blog: [
        "R.O.A.D. R.A.G.E. is an autonomous lane-keeping system built around a computer-vision pipeline in PyTorch, using YOLOP for joint lane and road-object perception, combined with OpenCV for pre/post-processing of the video stream.",
        "Perception alone doesn't drive a car: a PID controller takes the lane geometry estimated by the vision pipeline and turns it into steering corrections, closing the loop between what the model 'sees' and what the car does next.",
        "The model was trained on Comma2k19, a real-world driving dataset weighing in at roughly 100GB, which meant a fair amount of the engineering effort went into data loading and preprocessing efficiently rather than the model architecture itself.",
        "The whole pipeline runs inside the BeamNG.tech simulator in real time, at around 10Hz — fast enough to keep the car centered in its lane under varying road conditions without the perception loop becoming the bottleneck."
      ]
    },
    es: {
      title: "R.O.A.D. R.A.G.E.",
      tagline: "Mantenimiento de carril autónomo, en tiempo real",
      summary:
        "Un pipeline de visión por computadora para mantenimiento de carril autónomo, combinando YOLOP con un controlador PID, entrenado sobre el dataset Comma2k19 (~100GB) y corriendo en tiempo real dentro del simulador BeamNG.tech.",
      blog: [
        "R.O.A.D. R.A.G.E. es un sistema autónomo de mantenimiento de carril construido alrededor de un pipeline de visión en PyTorch, usando YOLOP para la percepción conjunta de carriles y objetos en la ruta, combinado con OpenCV para el pre y post procesamiento del video.",
        "Con percepción sola no alcanza para manejar: un controlador PID toma la geometría del carril estimada por el pipeline de visión y la convierte en correcciones de dirección, cerrando el lazo entre lo que el modelo 've' y lo que el auto hace después.",
        "El modelo se entrenó sobre Comma2k19, un dataset de manejo real de unos 100GB, así que buena parte del esfuerzo de ingeniería se fue en cargar y preprocesar los datos de forma eficiente más que en la arquitectura del modelo en sí.",
        "Todo el pipeline corre dentro del simulador BeamNG.tech en tiempo real, a unos 10Hz: suficientemente rápido para mantener el auto centrado en su carril en distintas condiciones de ruta sin que la percepción se transforme en el cuello de botella."
      ]
    }
  },
  {
    id: "saints-calendar",
    glyph: "images/icons/time_and_date-32.png?v=08a436bb",
    images: ["images/preview-saints-calendar.png?v=df6bea6b"],
    tech: ["Python", "Scraping", "Static site"],
    repo: "https://github.com/VANAFA/catholic-saints-calendar",
    liveUrl: "https://vanafa.github.io/catholic-saints-calendar/",
    en: {
      title: "Saints Calendar",
      tagline: "The daily saints and gospel, scraped and published",
      summary:
        "A website showing the Catholic calendar of saints for each day, with information pulled from Wikipedia and the gospel reading of the day, published as a static site.",
      blog: [
        "This project publishes the Catholic calendar of saints as a website: for any given day it shows which saints are commemorated, with a short biography, plus the gospel reading for that date.",
        "The saint data is scraped from Wikipedia and consolidated into a CSV that acts as the site's database. A separate scraper fetches the daily gospel, and a small shell script refreshes it so the published site stays current without manual editing.",
        "A fair amount of the work was data cleaning rather than scraping: deduplicating saints that appear under several name variants, normalising tags, and migrating the CSV schema as the structure grew.",
        "The output is deliberately plain static HTML so it can be hosted anywhere, with the Python side acting purely as a build and refresh step."
      ]
    },
    es: {
      title: "Calendario de Santos",
      tagline: "El santoral y el evangelio del día, scrapeados y publicados",
      summary:
        "Un sitio web que muestra el santoral católico de cada día, con información traída de Wikipedia y el evangelio del día, publicado como sitio estático.",
      blog: [
        "Este proyecto publica el santoral católico como sitio web: para cada día muestra qué santos se conmemoran, con una biografía corta, más el evangelio correspondiente a esa fecha.",
        "Los datos de los santos se scrapean de Wikipedia y se consolidan en un CSV que funciona como base de datos del sitio. Un scraper aparte trae el evangelio diario, y un script de shell lo actualiza para que el sitio publicado se mantenga al día sin edición manual.",
        "Buena parte del laburo fue limpieza de datos más que scraping: deduplicar santos que aparecen bajo varias variantes de nombre, normalizar etiquetas y migrar el esquema del CSV a medida que la estructura crecía.",
        "La salida es HTML estático a propósito, así se puede hostear en cualquier lado, con la parte de Python funcionando solamente como paso de build y actualización."
      ]
    }
  },
  {
    id: "scout-blueprints",
    glyph: "images/icons/paint_file-32.png?v=24d31d57",
    images: ["images/preview-scout-blueprints.png?v=45d74f24"],
    tech: ["Python", "3-D geometry", "Scouting"],
    repo: "https://github.com/VANAFA/scout-camp-blueprint-generator",
    liveUrl: "https://vanafa.github.io/scout-camp-blueprint-generator/",
    en: {
      title: "Scout Blueprints",
      tagline: "3-D construction plans for scout pioneering",
      summary:
        "A Python engine for designing scout pioneering structures — towers, watchtowers, stars — and rendering them as rotating 3-D blueprints that can actually be taken into the field.",
      blog: [
        "Scout pioneering means building real structures out of poles and rope: towers, watchtowers, bridges. Planning one usually happens on paper, which makes it hard to see whether the thing will actually stand up before you're standing in a field with a pile of poles.",
        "This engine lets a structure be described in code as poles between 3-D grid coordinates, then handles the geometry, colouring, labelling and rendering, producing a rotating 3-D blueprint you can look at from any angle.",
        "The important part is that it works within real constraints rather than treating the design as pure geometry: poles come in fixed lengths (short and long), and a fixed number of scouts have to be able to build it, so the engine is configured with both.",
        "It ships with ready-made presets — a simple tower, a mangrullo (watchtower) and a star — plus a guide for writing your own, and an interactive selector for rendering them."
      ]
    },
    es: {
      title: "Planos Scout",
      tagline: "Planos 3-D de construcciones para pioneerismo scout",
      summary:
        "Un motor en Python para diseñar construcciones de pioneerismo scout —torres, mangrullos, estrellas— y renderizarlas como planos 3-D rotativos que se pueden llevar al campamento.",
      blog: [
        "El pioneerismo scout es construir estructuras reales con palos y soga: torres, mangrullos, puentes. Planificar una suele hacerse en papel, y así es difícil saber si la cosa se va a sostener antes de estar parado en el campo con una pila de palos.",
        "Este motor permite describir una estructura en código, como palos entre coordenadas de una grilla 3-D, y se encarga de la geometría, los colores, las etiquetas y el renderizado, generando un plano 3-D rotativo que se puede mirar desde cualquier ángulo.",
        "Lo importante es que trabaja con restricciones reales en vez de tratar el diseño como geometría pura: los palos vienen en largos fijos (cortos y largos), y una cantidad determinada de scouts tiene que poder construirlo, así que el motor se configura con las dos cosas.",
        "Viene con presets ya armados —una torre simple, un mangrullo y una estrella—, más una guía para escribir los propios y un selector interactivo para renderizarlos."
      ]
    }
  },
  {
    id: "filesystem-drivers",
    glyph: "images/icons/hard_disk_drive-32.png?v=b08d7b6a",
    images: ["images/preview-filesystem-drivers.png?v=8693f362"],
    tech: ["C++", "FAT32", "EXT", "NTFS"],
    repo: "https://github.com/VANAFA/filesystem-drivers-fat-ext-ntfs",
    en: {
      title: "Filesystem Drivers",
      tagline: "Reading FAT32, EXT and NTFS from raw disk images",
      summary:
        "Read-only drivers for three filesystems, implemented in C++ against raw disk images: parsing the superblock, walking directory trees and reading file contents.",
      blog: [
        "This project implements drivers that can read FAT32, EXT and NTFS filesystems directly from a raw disk image, without any help from the operating system's own filesystem layer.",
        "Each driver derives from a common base class and implements the same set of operations: read the superblock and report the filesystem's parameters, navigate the directory tree, and read the contents of a file.",
        "Doing this means working at the level the filesystem actually stores things: cluster chains and the FAT table for FAT32, inodes and block groups for EXT, and the Master File Table for NTFS. The three formats solve the same problem in very different ways, which is the interesting part of writing all three.",
        "Output is validated against reference output files, so each implementation can be checked byte-for-byte rather than by eye."
      ]
    },
    es: {
      title: "Drivers de Filesystem",
      tagline: "Leer FAT32, EXT y NTFS desde imágenes de disco crudas",
      summary:
        "Drivers de solo lectura para tres sistemas de archivos, implementados en C++ sobre imágenes de disco crudas: parseo del superbloque, recorrido de directorios y lectura de archivos.",
      blog: [
        "Este proyecto implementa drivers capaces de leer sistemas de archivos FAT32, EXT y NTFS directamente desde una imagen de disco cruda, sin ninguna ayuda de la capa de filesystem del sistema operativo.",
        "Cada driver hereda de una clase base común e implementa el mismo conjunto de operaciones: leer el superbloque y reportar los parámetros del filesystem, navegar el árbol de directorios y leer el contenido de un archivo.",
        "Hacer esto implica trabajar al nivel en que el filesystem realmente guarda las cosas: cadenas de clusters y la tabla FAT en FAT32, inodos y grupos de bloques en EXT, y la Master File Table en NTFS. Los tres formatos resuelven el mismo problema de maneras muy distintas, y ahí está lo interesante de escribir los tres.",
        "La salida se valida contra archivos de referencia, así cada implementación se chequea byte a byte y no a ojo."
      ]
    }
  },
  {
    id: "phoneme-synthesis",
    glyph: "images/icons/microphone-32.png?v=cc1ae2ae",
    images: ["images/preview-phoneme-synthesis.png?v=0e58d59e"],
    tech: ["Python", "SciPy", "DSP", "LPC"],
    repo: "https://github.com/VANAFA/phoneme-synthesis-estimation",
    en: {
      title: "Phoneme Synthesis",
      tagline: "Synthesising speech sounds from filter coefficients",
      summary:
        "Synthesis of Spanish phonemes using all-pole filters that model the vocal tract, and estimation of those filter parameters back from the resulting audio.",
      blog: [
        "Each phoneme here is modelled as an excitation signal passed through an all-pole IIR filter whose coefficients characterise the shape of the vocal tract: an impulse train for voiced sounds, noise for unvoiced ones.",
        "Vowels (a, e, i, o, u) and fricatives (s, sh, f, j) each get their own 20th-order coefficient set, so synthesising a sound is a matter of filtering the right excitation with the right coefficients.",
        "The analysis side goes the other way: the filter's frequency response is compared against the spectrum of the synthesised audio, so the formant peaks that make a vowel sound like that vowel can be seen directly.",
        "Finally the parameters are estimated back from the signal and compared against the known ground-truth coefficients — closing the loop between synthesis and estimation."
      ]
    },
    es: {
      title: "Síntesis de Fonemas",
      tagline: "Sintetizar sonidos del habla a partir de coeficientes",
      summary:
        "Síntesis de fonemas del español usando filtros todo-polos que modelan el tracto vocal, y estimación de esos parámetros del filtro a partir del audio resultante.",
      blog: [
        "Acá cada fonema se modela como una señal de excitación que pasa por un filtro IIR todo-polos cuyos coeficientes caracterizan la forma del tracto vocal: un tren de impulsos para los sonidos sonoros y ruido para los sordos.",
        "Las vocales (a, e, i, o, u) y las fricativas (s, sh, f, j) tienen cada una su propio juego de coeficientes de orden 20, así que sintetizar un sonido es cuestión de filtrar la excitación correcta con los coeficientes correctos.",
        "El análisis va para el otro lado: se compara la respuesta en frecuencia del filtro contra el espectro del audio sintetizado, así se ven directamente los picos de formantes que hacen que una vocal suene como esa vocal.",
        "Por último se estiman los parámetros de vuelta a partir de la señal y se comparan con los coeficientes reales conocidos, cerrando el círculo entre síntesis y estimación."
      ]
    }
  },
  {
    id: "arch-os-labs",
    glyph: "images/icons/computer_taskmgr-32.png?v=e7a2dac0",
    images: ["images/preview-arch-os-labs.png?v=b47aad6b"],
    tech: ["C", "ARMv8", "x86-64", "Concurrency"],
    repo: "https://github.com/VANAFA/computer-architecture-os-labs-mirror",
    en: {
      title: "Architecture & OS Labs",
      tagline: "From an ARM simulator to a thread pool",
      summary:
        "Five low-level labs covering computer architecture and operating systems: an ARMv8 CPU simulator, an x86 binary bomb, filesystem drivers, a shell, and a thread pool.",
      blog: [
        "This repository collects five labs that work down the stack, each in C or C++.",
        "The ARMv8 simulator fetches, decodes and executes a subset of the instruction set, maintaining registers, memory and condition flags — effectively a small CPU in software. The x86 binary bomb goes the other direction: reverse engineering a compiled binary in GDB to work out what input each phase demands.",
        "The filesystem lab implements read-only drivers for FAT32, EXT and NTFS against raw disk images. The shell lab builds a working command interpreter with pipes and process management on top of fork/exec.",
        "The last one is a thread pool: worker threads, a task queue, and the synchronisation needed to hand work between them without races. Together they cover the path from a single instruction to concurrent processes."
      ]
    },
    es: {
      title: "Labs de Arquitectura y SO",
      tagline: "De un simulador de ARM a un thread pool",
      summary:
        "Cinco trabajos de bajo nivel de arquitectura de computadoras y sistemas operativos: un simulador de CPU ARMv8, un binary bomb de x86, drivers de filesystem, una shell y un thread pool.",
      blog: [
        "Este repositorio junta cinco trabajos que van bajando por el stack, cada uno en C o C++.",
        "El simulador de ARMv8 busca, decodifica y ejecuta un subconjunto del set de instrucciones, manteniendo registros, memoria y flags de condición: básicamente una CPU chica en software. El binary bomb de x86 va para el lado contrario: hacer ingeniería inversa de un binario compilado con GDB para descubrir qué entrada pide cada fase.",
        "El trabajo de filesystems implementa drivers de solo lectura para FAT32, EXT y NTFS sobre imágenes de disco crudas. El de shell arma un intérprete de comandos funcional con pipes y manejo de procesos sobre fork/exec.",
        "El último es un thread pool: hilos worker, una cola de tareas y la sincronización necesaria para pasarse trabajo entre ellos sin condiciones de carrera. Entre todos cubren el camino desde una instrucción hasta procesos concurrentes."
      ]
    }
  },
  {
    id: "paradigms",
    glyph: "images/icons/notepad_file-32.png?v=9efaa362",
    images: ["images/preview-paradigms.png?v=7a8839b3"],
    tech: ["Haskell", "Java", "OOP", "Functional"],
    repo: "https://github.com/VANAFA/programming-paradigms-labs",
    en: {
      title: "Programming Paradigms",
      tagline: "The same problems, functional and object-oriented",
      summary:
        "Coursework across two paradigms: pure functional programming in Haskell, and object-oriented design in Java.",
      blog: [
        "The point of this coursework is contrast: solving structural problems first with pure functions and algebraic data types, then with objects and inheritance, and seeing what each approach makes easy or awkward.",
        "The Haskell side models a map — cities, regions, points, links and tunnels — as algebraic data types with pure functions over them, plus a test module. No mutable state anywhere, so the structure of the data has to carry the meaning.",
        "The Java side covers queue implementations and two larger object-oriented design exercises, where the same kind of modelling is done with classes, interfaces and inheritance instead.",
        "Doing both back to back is the actual lesson: the functional version makes transformations obvious and state changes painful, and the object-oriented version does the reverse."
      ]
    },
    es: {
      title: "Paradigmas de Programación",
      tagline: "Los mismos problemas, funcional y orientado a objetos",
      summary:
        "Trabajos prácticos en dos paradigmas: programación funcional pura en Haskell y diseño orientado a objetos en Java.",
      blog: [
        "El sentido de estos trabajos es el contraste: resolver problemas estructurales primero con funciones puras y tipos algebraicos, después con objetos y herencia, y ver qué le resulta fácil o incómodo a cada enfoque.",
        "La parte de Haskell modela un mapa —ciudades, regiones, puntos, enlaces y túneles— como tipos algebraicos con funciones puras encima, más un módulo de tests. No hay estado mutable en ningún lado, así que la estructura de los datos tiene que cargar con el significado.",
        "La parte de Java cubre implementaciones de colas y dos ejercicios más grandes de diseño orientado a objetos, donde el mismo tipo de modelado se hace con clases, interfaces y herencia.",
        "Hacer los dos seguidos es la verdadera lección: la versión funcional hace obvias las transformaciones y dolorosos los cambios de estado, y la orientada a objetos hace exactamente lo contrario."
      ]
    }
  },
  {
    id: "coursework-archive",
    glyph: "images/icons/directory_open_file_mydocs-32.png?v=d2e0e15b",
    images: ["images/preview-coursework-archive.png?v=c072ef13"],
    tech: ["Python", "Machine Learning", "AI"],
    repo: "https://github.com/VANAFA/udesa-coursework-archive",
    en: {
      title: "Coursework Archive",
      tagline: "AI and machine learning assignments, kept for reference",
      summary:
        "An archive of university coursework in artificial intelligence and machine learning, including a machine learning final project with its notebook, scripts and data.",
      blog: [
        "Not everything worth keeping is worth its own repository. This one is an archive of assorted coursework from the AI engineering degree, organised by the year and semester it was done in.",
        "The largest piece in it is a machine learning final project, with its notebook, supporting scripts, dataset and a document laying out the project's goals.",
        "Alongside it sits earlier work from the fundamentals of artificial intelligence course, including its first assignment and the accompanying notes.",
        "It's kept public mostly as a record of the path: the earlier material is noticeably rougher than the later, which is rather the point of keeping it."
      ]
    },
    es: {
      title: "Archivo de Trabajos",
      tagline: "Trabajos de IA y machine learning, guardados como referencia",
      summary:
        "Un archivo de trabajos prácticos de la facultad en inteligencia artificial y machine learning, incluido un trabajo final de machine learning con su notebook, scripts y datos.",
      blog: [
        "No todo lo que vale la pena guardar merece su propio repositorio. Este es un archivo de trabajos varios de la carrera de ingeniería en IA, organizado por el año y cuatrimestre en que se hicieron.",
        "Lo más grande que hay adentro es un trabajo final de machine learning, con su notebook, scripts de apoyo, dataset y un documento con los objetivos del proyecto.",
        "Al lado están trabajos anteriores de la materia de fundamentos de inteligencia artificial, incluido su primer trabajo práctico y las notas que lo acompañan.",
        "Lo mantengo público sobre todo como registro del camino recorrido: lo más viejo es bastante más crudo que lo más nuevo, y justamente por eso lo guardo."
      ]
    }
  },
  {
    id: "truequeba",
    glyph: "images/icons/briefcase-32.png?v=f483e348",
    images: ["images/preview-truequeba.png?v=1036afda"],
    tech: ["React", "Node.js", "Docker", "nginx", "OAuth"],
    en: {
      title: "TruequeBA",
      tagline: "A barter and second-hand marketplace for Argentina",
      summary:
        "A full-stack marketplace where people list used items for sale or for trade, propose swaps combining goods and cash, and run their own small storefront.",
      blog: [
        "TruequeBA is a marketplace built around a habit that is very common in Argentina: not just buying and selling second-hand goods, but trading them. A listing can be offered for money, for barter, or for both, and a buyer can propose an exchange that combines one of their own items with some cash to balance the difference.",
        "Each user gets their own storefront: listings with multiple photos, prices in Argentine pesos, categories, condition and search filters, plus a notification system for incoming proposals and a profile with several ways to be contacted.",
        "The stack is a React client and a Node backend, containerised with Docker Compose and served behind nginx, with Google OAuth for sign-in and image processing for the uploaded photos. There is a separate production compose file and deployment scripts, so the whole thing can be brought up on a server rather than only running locally.",
        "The interesting part of this project wasn't any single algorithm — it was everything a real product needs around the core idea: authentication, image handling, deployment, end-to-end tests with Playwright, and the reality that a trade needs both sides to agree before anything happens."
      ]
    },
    es: {
      title: "TruequeBA",
      tagline: "Un marketplace de trueque y usados para Argentina",
      summary:
        "Un marketplace full-stack donde la gente publica artículos usados para vender o intercambiar, propone trueques combinando productos y plata, y maneja su propia tienda.",
      blog: [
        "TruequeBA es un marketplace armado alrededor de una costumbre bien argentina: no solo comprar y vender usados, sino cambiarlos. Una publicación se puede ofrecer por plata, por trueque o por las dos cosas, y quien compra puede proponer un intercambio que combine un producto propio más algo de plata para emparejar la diferencia.",
        "Cada usuario tiene su propia tienda: publicaciones con varias fotos, precios en pesos, categorías, estado y filtros de búsqueda, más un sistema de notificaciones para las propuestas que le llegan y un perfil con varios métodos de contacto.",
        "El stack es un cliente en React y un backend en Node, contenerizado con Docker Compose y servido detrás de nginx, con Google OAuth para el login y procesamiento de las imágenes que se suben. Hay un compose de producción aparte y scripts de deploy, así que se puede levantar en un servidor y no solo correr localmente.",
        "Lo interesante de este proyecto no fue ningún algoritmo puntual, sino todo lo que un producto real necesita alrededor de la idea central: autenticación, manejo de imágenes, deploy, tests end-to-end con Playwright, y el hecho de que un trueque necesita que las dos partes estén de acuerdo antes de que pase algo."
      ]
    }
  },
  {
    id: "this-site",
    glyph: "images/icons/computer_explorer-32.png?v=cc0d052a",
    images: ["images/preview-this-site.png?v=03fd4171"],
    tech: ["HTML", "CSS", "JavaScript"],
    repo: "https://github.com/VANAFA/portfolio",
    liveUrl: "https://nallib.ar",
    en: {
      title: "This Website",
      tagline: "The Windows 98 desktop you're looking at",
      summary:
        "The source of this site: a dependency-free static page styled like Windows 98, with working windows, a taskbar, and a project list that builds itself from a single data file.",
      blog: [
        "This site is deliberately as light as it can be: plain HTML, CSS and JavaScript with no framework, no build step and no external requests. You can open index.html straight off disk and it works.",
        "The Windows 98 look is hand-written CSS rather than a library — the beveled borders, gradient title bars and grey window chrome are all just borders and box shadows in the right places. The icons are genuine Windows 98 .ico files, extracted at fixed sizes so they stay crisp.",
        "Every window has working minimize, maximize and close buttons plus a taskbar button, so a closed window can be brought back. The project list, these blog pages and the language toggle all render from one data file: adding a project means adding one object to it.",
        "The version number in the corner of the taskbar shows which commit is actually deployed, which turned out to be the fastest way to tell a real bug from a stale browser cache."
      ]
    },
    es: {
      title: "Este Sitio",
      tagline: "El escritorio de Windows 98 que estás mirando",
      summary:
        "El código de este sitio: una página estática sin dependencias con estética de Windows 98, con ventanas funcionales, barra de tareas y una lista de proyectos que se arma sola desde un único archivo de datos.",
      blog: [
        "Este sitio es lo más liviano que se pueda: HTML, CSS y JavaScript planos, sin framework, sin paso de build y sin pedidos externos. Podés abrir index.html directo del disco y funciona.",
        "La estética de Windows 98 es CSS escrito a mano, no una librería: los bordes biselados, las barras de título con degradé y el gris de las ventanas son todos bordes y sombras puestos en el lugar justo. Los iconos son archivos .ico originales de Windows 98, extraídos a tamaños fijos para que queden nítidos.",
        "Cada ventana tiene botones de minimizar, maximizar y cerrar que funcionan, más su botón en la barra de tareas, así una ventana cerrada se puede volver a abrir. La lista de proyectos, estas páginas de blog y el cambio de idioma se generan todos desde un solo archivo de datos: agregar un proyecto es agregar un objeto ahí.",
        "El número de versión en la esquina de la barra de tareas muestra qué commit está realmente desplegado, que resultó ser la forma más rápida de distinguir un bug real de un caché viejo del navegador."
      ]
    }
  }
];
