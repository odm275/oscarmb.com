import socialsData from "@/data/socials.json";
import { socialSchema, type Experience } from "@/lib/schemas";

const socials = socialSchema.parse(socialsData).socials;
const linkedIn = socials.find((s) => s.name === "LinkedIn")!;
const emailSocial = socials.find((s) => s.name === "Email")!;

const CONTACT = {
  name: "Oscar Mejia",
  phone: "(281) 713-0784",
  location: "Houston, TX",
  citizenship: "US Citizen",
  email: emailSocial.href.replace("mailto:", ""),
  linkedin: {
    label: linkedIn.href.replace("https://", ""),
    href: linkedIn.href,
  },
  website: { label: "oscarmb.com", href: "https://oscarmb.com" },
};

const SKILLS = [
  {
    category: "Languages",
    items: "TypeScript, JavaScript (Node.js), HTML5, CSS",
  },
  {
    category: "Frontend",
    items: "React, Next.js, React Query, Stencil.js, Redux, Tailwind, A11y",
  },
  {
    category: "Backend",
    items: "Express.js, tRPC, GraphQL, REST APIs, PostgreSQL, Ruby on Rails",
  },
  {
    category: "Tools",
    items:
      "Docker, Google Cloud, Splunk, Git, Jest, MSW, Playwright, Biome, Git, Github, Docker, Charles Proxy, Claude Code, Cursor, Storybook",
  },
];

const DEFAULT_LOCATION = "Houston, TX";

interface ResumeDocumentProps {
  career: Experience[];
}

function Separator() {
  return <span className="mx-[3pt]">⋄</span>;
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mt-[8pt]">
      <div className="text-[11pt] font-bold uppercase">{title}</div>
      <hr className="mt-[6pt] border-t border-black" />
    </div>
  );
}

function ExperienceEntry({ job }: { job: Experience }) {
  const dateRange = job.end
    ? `${job.start} - ${job.end}`
    : `${job.start} - present`;
  const location = job.location ?? DEFAULT_LOCATION;

  return (
    <div>
      <div className="flex justify-between text-[11pt]">
        <span className="font-bold">{job.title}</span>
        <span>{dateRange}</span>
      </div>
      <div className="flex justify-between text-[11pt]">
        <span>{job.name}</span>
        <span className="italic">{location}</span>
      </div>
      {job.description && job.description.length > 0 && (
        <ul className="m-0 mt-[2pt] list-disc pl-[2em]">
          {job.description.map((bullet, i) => (
            <li key={i} className="pl-[0.3em] leading-[1.24]">
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResumeDocument({ career }: ResumeDocumentProps) {
  return (
    <div className="font-serif text-[11pt] leading-[1.24] text-black">
      <h1 className="m-0 text-center text-[17pt] font-bold uppercase leading-tight">
        {CONTACT.name}
      </h1>

      <div className="mt-[4pt] text-center text-[11pt]">
        {CONTACT.phone}
        <Separator />
        {CONTACT.location}
        <Separator />
        {CONTACT.citizenship}
      </div>

      <div className="mt-[2pt] text-center text-[11pt]">
        <a href={`mailto:${CONTACT.email}`} className="text-blue-700">
          {CONTACT.email}
        </a>
        <Separator />
        <a href={CONTACT.linkedin.href} className="text-blue-700">
          {CONTACT.linkedin.label}
        </a>
        <Separator />
        <a href={CONTACT.website.href} className="text-blue-700">
          {CONTACT.website.label}
        </a>
      </div>

      <SectionHeading title="Skills" />
      <table className="mt-[4pt] w-full text-[11pt]">
        <tbody>
          {SKILLS.map((skill) => (
            <tr key={skill.category}>
              <td className="whitespace-nowrap pr-[8pt] align-top font-bold">
                {skill.category}
              </td>
              <td>{skill.items}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionHeading title="Experience" />
      <div className="mt-[4pt] space-y-[8pt]">
        {career.map((job, i) => (
          <ExperienceEntry key={i} job={job} />
        ))}
      </div>
    </div>
  );
}
