import { Bone } from "@/components/ui/bone";
import { BONE_CAPTURES } from "@/bones/fixtures";

export default function BonesCapturePage() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="mb-8 font-display text-xl font-semibold">Boneyard capture</h1>
      <div className="space-y-16">
        {BONE_CAPTURES.map(({ name, fixture }) => (
          <section key={name} className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{name}</p>
            <Bone name={name} loading={false} fixture={fixture}>
              {fixture}
            </Bone>
          </section>
        ))}
      </div>
    </div>
  );
}
