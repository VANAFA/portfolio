/*
 * ============================================================
 *  PROJECTS DATA — the ONLY file you need to touch to add a
 *  new project/blog.
 *
 *  Add a new object to the PROJECTS array below. As soon as you
 *  save this file:
 *    - a new icon appears in the "My Projects" list on index.html
 *    - clicking it opens the pop-up window with your summary/photos
 *    - "Read the full blog" opens blog.html?id=YOUR_ID, which
 *      renders itself automatically from the `blog` field below
 *      (no extra HTML file needed).
 *
 *  Fields:
 *    id       (string, required)  unique slug, used in the URL:
 *                                  blog.html?id=this-value
 *    title    (string, required)  project name
 *    glyph    (string)            path to an icon image (see images/icons/) used as the icon
 *    tagline  (string)            one-liner shown under the icon & in the popup title
 *    tech     (string[])          short list of tags/technologies
 *    summary  (string)            short paragraph shown in the pop-up window
 *    images   (string[])          image paths for the pop-up + blog gallery
 *    blog     (string[])          one string per paragraph, full blog text
 *    links    ({label,url}[])     optional extra links (repo, demo, paper...)
 * ============================================================
 */

window.PROJECTS = [
  {
    id: "noob",
    title: "N.O.O.B.",
    glyph: "images/icons/gamepad.svg",
    tagline: "An LLM-narrated RPG, built full-stack",
    tech: ["React", "TypeScript", "FastAPI", "Qwen3-4B", "LoRA fine-tuning"],
    summary:
      "A chat-based narrative RPG where a fine-tuned language model plays the game master. Frontend in React/TypeScript talks to a FastAPI backend that serves Qwen3-4B as the story's narrator.",
    images: ["images/placeholder-noob.svg"],
    blog: [
      "N.O.O.B. is a chat-based, narrative-driven RPG where the game master is a language model instead of a person. The frontend is built with React and TypeScript, and it talks to a FastAPI backend that serves Qwen3-4B as the narrator, generating the world, the NPCs and the consequences of the player's choices in real time.",
      "Getting a small model to behave like a consistent, engaging game master took more than prompting. I fine-tuned Qwen3-4B with LoRA on curated narrative data, and layered activation steering on top to nudge tone and pacing at inference time without retraining.",
      "One of the harder constraints was context length: a long-running RPG session accumulates state fast (inventory, past choices, NPC relationships), and every extra token costs latency. By restructuring how history was summarized and fed back into the model, I cut context tokens by 36% without losing narrative coherence.",
      "The result is a full-stack project that touches product (what makes a game session feel alive), systems (serving an LLM with acceptable latency), and ML research (LoRA fine-tuning and activation steering) end to end."
    ],
    links: []
  },
  {
    id: "facelab",
    title: "Deep Learning Lab",
    glyph: "images/icons/network.svg",
    tagline: "Architecture search & unsupervised learning on faces",
    tech: ["PyTorch", "Autoencoders", "Clustering", "Unsupervised Learning"],
    summary:
      "A deep learning lab project: neural networks implemented from scratch, autoencoders and clustering pipelines used to reconstruct and interpolate between facial images.",
    images: ["images/placeholder-facelab.svg"],
    blog: [
      "This project came out of a deep learning laboratory course focused on architecture search and unsupervised learning. Rather than relying on off-the-shelf layers, several core building blocks were implemented from scratch to really understand what's happening inside the network during training.",
      "The core of the project is a set of autoencoders trained on facial image datasets, used both for reconstruction and for latent-space interpolation — smoothly morphing between two faces by walking through the learned latent representation.",
      "On top of the autoencoders, unsupervised clustering pipelines were built to organize the learned latent space, grouping similar faces without any labels and using that structure to guide the interpolation quality.",
      "The project was a hands-on exploration of representation learning: how a network chooses to encode a face into a handful of numbers, and how much of that structure can be recovered and manipulated after the fact."
    ],
    links: []
  },
  {
    id: "road-rage",
    title: "R.O.A.D. R.A.G.E.",
    glyph: "images/icons/car.svg",
    tagline: "Autonomous lane-keeping, running in real time",
    tech: ["PyTorch", "YOLOP", "OpenCV", "PID Control", "Comma2k19"],
    summary:
      "A computer-vision pipeline for autonomous lane keeping, combining YOLOP with a PID controller, trained on the ~100GB Comma2k19 dataset and running in real time inside the BeamNG.tech simulator.",
    images: ["images/placeholder-roadrage.svg"],
    blog: [
      "R.O.A.D. R.A.G.E. is an autonomous lane-keeping system built around a computer-vision pipeline in PyTorch, using YOLOP for joint lane and road-object perception, combined with OpenCV for pre/post-processing of the video stream.",
      "Perception alone doesn't drive a car: a PID controller takes the lane geometry estimated by the vision pipeline and turns it into steering corrections, closing the loop between what the model 'sees' and what the car does next.",
      "The model was trained on Comma2k19, a real-world driving dataset weighing in at roughly 100GB, which meant a fair amount of the engineering effort went into data loading and preprocessing efficiently rather than the model architecture itself.",
      "The whole pipeline runs inside the BeamNG.tech simulator in real time, at around 10Hz — fast enough to keep the car centered in its lane under varying road conditions without the perception loop becoming the bottleneck."
    ],
    links: []
  }
];
