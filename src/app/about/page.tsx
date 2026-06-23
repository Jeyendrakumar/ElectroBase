import { Cpu, ExternalLink, Globe, Mail } from "lucide-react";

const developers = [
  {
    name: "Jeyendrakumar",
    role: "Project Lead & Developer",
    description: "Full-stack developer responsible for architecture, database design, and core application development.",
    links: [
      { href: "#", icon: ExternalLink, label: "Portfolio" },
      { href: "#", icon: Globe, label: "Website" },
    ],
  },
  {
    name: "Selva.Ux",
    role: "Developer & Designer",
    description: "Frontend developer and UI/UX designer responsible for the visual design, component library, and user experience.",
    links: [
      { href: "https://selvaux.in", icon: ExternalLink, label: "Portfolio" },
      { href: "#", icon: Mail, label: "Email" },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10 py-6 max-w-3xl mx-auto">
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-400">
          <Cpu size={12} />
          <span>ABOUT ELECTROBASE</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">About This Project</h1>
        <p className="text-muted-foreground leading-relaxed">
          ElectroBase is the ultimate all-in-one reference library built for electronic and hardware engineers, designers, and hobbyists.
          It serves as a comprehensive, centralized portal to find essential specifications, pinout configurations, footprint layouts, and datasheets for a vast catalog of components in one place.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Whether you need details on logic ICs, microcontrollers, communication modules, motor drivers, display modules, or passive components, ElectroBase is designed to accelerate your hardware design flow.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Developers</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {developers.map((dev) => (
            <div
              key={dev.name}
              className="rounded-xl glass border border-border/40 p-6 space-y-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">{dev.name}</h3>
                <p className="text-sm font-mono text-cyan-400">{dev.role}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{dev.description}</p>
              <div className="flex gap-3 pt-2">
                {dev.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 transition-colors"
                  >
                    <link.icon size={14} />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
