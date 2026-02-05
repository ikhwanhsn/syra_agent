 import { Link } from "react-router-dom";
 import { DocsLayout } from "@/components/docs/DocsLayout";
 import { CodeBlock } from "@/components/docs/CodeBlock";
 import { ArrowLeft, ArrowRight } from "lucide-react";
 
 const tocItems = [
   { id: "what-is-an-agent", title: "What is an Agent?", level: 2 },
   { id: "agent-lifecycle", title: "Agent Lifecycle", level: 2 },
   { id: "creating-agents", title: "Creating Agents", level: 2 },
   { id: "agent-configuration", title: "Agent Configuration", level: 2 },
   { id: "tools-and-actions", title: "Tools and Actions", level: 2 },
 ];
 
 export default function CoreConcepts() {
   return (
     <DocsLayout toc={tocItems}>
       <div className="mb-8">
         <div className="text-sm text-primary font-medium mb-2">Core Concepts</div>
         <h1 className="text-4xl font-bold tracking-tight mb-4">Agents</h1>
         <p className="text-xl text-muted-foreground leading-relaxed">
           Agents are the fundamental building blocks of Syra. Learn how to create, 
           configure, and orchestrate intelligent agents.
         </p>
       </div>
 
       <section id="what-is-an-agent" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">What is an Agent?</h2>
         
         <p className="text-muted-foreground mb-6 leading-relaxed">
           An <strong className="text-foreground">Agent</strong> in Syra is an autonomous 
           AI entity that can reason, remember, and take actions. Unlike simple chatbots 
           that only respond to prompts, agents can:
         </p>
 
         <ul className="space-y-2 mb-6">
           {[
             "Maintain context across conversations using memory",
             "Use tools to interact with external systems",
             "Make decisions and plan multi-step tasks",
             "Collaborate with other agents",
             "Learn and adapt from feedback",
           ].map((item) => (
             <li key={item} className="flex items-start gap-2 text-muted-foreground">
               <span className="text-primary mt-1.5">•</span>
               {item}
             </li>
           ))}
         </ul>
 
         <div className="p-4 rounded-lg border border-accent/20 bg-accent/5">
           <p className="text-sm">
             <strong className="text-accent">Think of agents as AI employees.</strong>{" "}
             You give them instructions, tools, and goals — and they figure out how to accomplish the task.
           </p>
         </div>
       </section>
 
       <section id="agent-lifecycle" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Agent Lifecycle</h2>
         
         <p className="text-muted-foreground mb-6">
           Every agent follows a predictable lifecycle:
         </p>
 
         <div className="flex flex-wrap gap-2 mb-6">
           {["Initialize", "Receive Input", "Reason", "Act", "Respond", "Remember"].map((step, i) => (
             <div key={step} className="flex items-center">
               <span className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium">
                 {step}
               </span>
               {i < 5 && <span className="mx-2 text-muted-foreground">→</span>}
             </div>
           ))}
         </div>
 
         <CodeBlock 
           code={`// The agent lifecycle in action
 const agent = new Agent({ name: "Assistant" });
 
 // 1. Receive input
 const input = "What's the weather in Tokyo?";
 
 // 2. Agent reasons about the task
 // 3. Agent uses weather tool
 // 4. Agent formulates response
 const result = await agent.run(input);
 
 // 5. Memory is automatically updated
 console.log(result.output);
 // "The current weather in Tokyo is 22°C with clear skies."`}
           language="typescript"
           showLineNumbers
         />
       </section>
 
       <section id="creating-agents" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Creating Agents</h2>
         
         <p className="text-muted-foreground mb-6">
           Create an agent with a few lines of code:
         </p>
 
         <CodeBlock 
           code={`import { Agent } from "@syra/sdk";
 
 // Create a basic agent
 const assistant = new Agent({
   name: "Assistant",
   model: "syra-3",
   instructions: \`
     You are a helpful AI assistant.
     Be concise but thorough.
     Always cite your sources.
   \`,
 });
 
 // Run the agent
 const response = await assistant.run("Explain quantum computing");
 console.log(response.output);`}
           language="typescript"
           filename="agents/assistant.ts"
           showLineNumbers
         />
       </section>
 
       <section id="agent-configuration" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Agent Configuration</h2>
         
         <p className="text-muted-foreground mb-6">
           Agents are highly configurable. Here are the key options:
         </p>
 
         <div className="overflow-x-auto">
           <table className="w-full text-sm">
             <thead>
               <tr className="border-b border-border">
                 <th className="text-left py-3 pr-4 font-medium">Option</th>
                 <th className="text-left py-3 pr-4 font-medium">Type</th>
                 <th className="text-left py-3 font-medium">Description</th>
               </tr>
             </thead>
             <tbody className="text-muted-foreground">
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono text-primary">name</td>
                 <td className="py-3 pr-4">string</td>
                 <td className="py-3">Unique identifier for the agent</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono text-primary">model</td>
                 <td className="py-3 pr-4">string</td>
                 <td className="py-3">AI model to use (syra-3, syra-3-turbo)</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono text-primary">instructions</td>
                 <td className="py-3 pr-4">string</td>
                 <td className="py-3">System prompt defining agent behavior</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono text-primary">tools</td>
                 <td className="py-3 pr-4">Tool[]</td>
                 <td className="py-3">Array of tools the agent can use</td>
               </tr>
               <tr className="border-b border-border">
                 <td className="py-3 pr-4 font-mono text-primary">memory</td>
                 <td className="py-3 pr-4">MemoryConfig</td>
                 <td className="py-3">Memory configuration for persistence</td>
               </tr>
               <tr>
                 <td className="py-3 pr-4 font-mono text-primary">temperature</td>
                 <td className="py-3 pr-4">number</td>
                 <td className="py-3">Creativity level (0-1, default: 0.7)</td>
               </tr>
             </tbody>
           </table>
         </div>
       </section>
 
       <section id="tools-and-actions" className="mb-12 scroll-mt-24">
         <h2 className="text-2xl font-semibold mb-4">Tools and Actions</h2>
         
         <p className="text-muted-foreground mb-6">
           Tools give agents the ability to interact with the real world:
         </p>
 
         <CodeBlock 
           code={`import { Agent, Tool } from "@syra/sdk";
 
 // Define a custom tool
 const weatherTool = new Tool({
   name: "get_weather",
   description: "Get the current weather for a location",
   parameters: {
     location: { type: "string", required: true },
     units: { type: "string", enum: ["celsius", "fahrenheit"] },
   },
   execute: async ({ location, units }) => {
     // Your implementation here
     const weather = await fetchWeather(location, units);
     return weather;
   },
 });
 
 // Create agent with tools
 const agent = new Agent({
   name: "WeatherBot",
   tools: [weatherTool],
 });`}
           language="typescript"
           filename="agents/weather-bot.ts"
           showLineNumbers
         />
       </section>
 
       {/* Navigation */}
       <div className="flex justify-between items-center pt-8 mt-8 border-t border-border">
         <Link
           to="/docs/installation/cli"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
           Installation
         </Link>
         <Link
           to="/docs/core-concepts/multi-agent"
           className="group flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
         >
           Multi-Agent Workflows
           <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
         </Link>
       </div>
     </DocsLayout>
   );
 }