import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  href?: string;
  linkText?: string;
}

export default function SectionHeader({ title, href, linkText = "View All" }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-10 border-b border-border pb-4">
      <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground">
        {title}
      </h2>
      {href && (
        <Link 
          href={href} 
          className="text-muted-foreground hover:text-foreground transition text-sm font-medium underline underline-offset-4 decoration-muted-foreground/50 hover:decoration-foreground"
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}