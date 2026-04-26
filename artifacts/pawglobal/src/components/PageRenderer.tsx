import type { PageSection } from "@/lib/page-defaults";

function renderBody(body: string) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={key++} className="list-disc list-outside ml-5 space-y-1.5 my-3">
          {listItems.map((li, i) => (
            <li key={i} className="text-muted-foreground leading-relaxed text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: li.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
            />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed) {
        elements.push(
          <p key={key++} className="text-muted-foreground leading-relaxed text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
          />
        );
      }
    }
  }
  flushList();
  return elements;
}

export function PageRenderer({ sections }: { sections: PageSection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <h2 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border">
            {section.title}
          </h2>
          <div className="space-y-3">{renderBody(section.body)}</div>
        </section>
      ))}
    </div>
  );
}
