# Related work

What else exists in this space, where it is ahead of this project, and what
this project measures that it does not. Scenarios and rubric text here are
original; nothing below was copied from these works.

## Multi-turn degradation and instruction drift

- **Laban et al. (2025), "LLMs Get Lost in Multi-Turn Conversation."**
  https://arxiv.org/abs/2505.06120
  Large-scale simulation across many models, finding a substantial drop in
  multi-turn versus single-turn performance. Instructions are revealed
  gradually, one piece per turn.
- **Li et al. (2024), "Measuring and Controlling Instruction (In)Stability in
  Language Model Dialogs."** https://arxiv.org/abs/2402.10962
  Instruction drift within eight rounds, measured with a system prompt, a
  self-chat between two chatbots, and a probe question.
- **Luz de Araujo et al. (2025), "Persistent Personas? Role-Playing,
  Instruction Following, and Safety in Extended Interactions."**
  https://arxiv.org/abs/2512.12775
  Persona dialogues of over 100 rounds; persona fidelity degrades over the
  dialogue.

## Chatbots and adolescent mental health

- **Vals.ai, evaluating AI safety in teen conversations.**
  https://www.vals.ai/blogs/evaluating-ai-safety-in-teen-conversations
  Notes that most mental-health safety evaluations test a single question;
  uses an LLM judge against a set of safety checks.
- **Common Sense Media, AI Chatbots for Mental Health Support.**
  https://institute.commonsensemedia.org/risk-assessments/ai-chatbots-for-mental-health-support
  Expert-framed risk assessment of leading chatbots across common adolescent
  mental-health conditions.
- **Sobowale et al. (2025), JMIR Mental Health.**
  https://mental.jmir.org/2025/1/e79838
  Trained human raters role-playing as youth, scoring chatbots with the
  CAPE-II framework.

## Where these works are ahead

- **Objective measures.** Laban et al. score tasks such as code, maths and
  database queries, where correctness can be checked directly. This project
  relies on safety judgments that involve interpretation, so it needs rubric
  validation, inter-rater reliability, and independent checks on AI-assigned
  scores before any result carries weight (`docs/limitations.md`, sections 3
  to 5).
- **Scale.** All three drift studies run far more conversations and models
  than this project has collected.
- **Validated human rating.** Sobowale et al. use trained raters and an
  established framework; Common Sense Media uses expert assessment. This
  project's expert calibration has not been collected.

## Limitations shared with these works

Laban et al. state that their simulated conversations are not representative
of natural human-AI conversations, so they cannot establish that the
degradation generalizes to real use. This project shares that limitation.
The planned study dataset aims to narrow it in two separate ways:
adolescent-authored language for ecological validity (how real teens
write), and psychiatrist-authored clinical content for clinical validity
(what should be tested and how it should be judged). Neither is present in
the v1.0.0 data.

## What this project measures

To our knowledge, the works above fall into two groups. The drift studies
measure how behaviour changes with conversation length, but for instructions,
tasks or personas the experimenter sets. The mental-health evaluations measure
built-in safety behaviour, but mostly at a single question or across a whole
conversation. This project combines the two: it scores a model's built-in
safety response at checkpoint turns placed at chosen depths in scripted
conversations, with isolated histories and blinded judges that see only the
checkpoint turn. That design can measure how a model's safety response changes
as a disclosure arrives later in a conversation, which a single-question test
cannot, because it only samples the first turn.

This is a claim about what the instrument can measure, not a finding. No study
data has been collected yet (`docs/limitations.md`, sections 1 and 2).