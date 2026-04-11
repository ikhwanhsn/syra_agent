import type { Project, ProjectAgent } from '../node_modules/@elizaos/core/dist/types/plugin';
import { character } from './character.js';
import syraBriefPlugin from './plugin.js';

const projectAgent: ProjectAgent = {
  character,
  plugins: [syraBriefPlugin],
};

const project: Project = {
  agents: [projectAgent],
};

export { character };

export default project;
