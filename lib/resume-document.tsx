import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { getResumeRoles, type ResumeContent } from "@/lib/resume-generation";
import type { Profile, WorkExperience } from "@/types";

type Density = "regular" | "compact";

type DocumentProps = {
  profile: Profile;
  content: ResumeContent;
  density: Density;
  onPageCount: (pageCount: number) => void;
};

// A PDF has no Tailwind tokens, so its two colours are named here.
const INK = "#111827";
const MUTED = "#4a5565";

const MAX_SKILLS = 30;
const COMPACT_BULLETS_PER_ROLE = 3;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Without this, long words are split with hyphens at line ends
Font.registerHyphenationCallback((word) => [word]);

const createStyles = (density: Density) => {
  const isCompact = density === "compact";
  const fontSize = isCompact ? 9 : 10;

  return StyleSheet.create({
    page: {
      padding: isCompact ? 28 : 36,
      fontFamily: "Helvetica",
      fontSize,
      lineHeight: isCompact ? 1.3 : 1.4,
      color: INK,
    },
    name: {
      fontFamily: "Helvetica-Bold",
      fontSize: isCompact ? 18 : 22,
      lineHeight: 1.2,
    },
    headline: { fontSize: fontSize + 2, color: MUTED, marginTop: 2 },
    contact: { color: MUTED, marginTop: 4 },
    section: { marginTop: isCompact ? 9 : 14 },
    sectionTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: fontSize + 0.5,
      letterSpacing: 1,
      paddingBottom: 3,
      marginBottom: isCompact ? 4 : 6,
      borderBottomWidth: 1,
      borderBottomColor: MUTED,
    },
    role: { marginBottom: isCompact ? 5 : 8 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    strong: { fontFamily: "Helvetica-Bold" },
    muted: { color: MUTED },
    bullet: { flexDirection: "row", marginTop: 2 },
    bulletMark: { width: 10 },
    bulletText: { flex: 1 },
    pageCounter: { position: "absolute", width: 0, height: 0 },
  });
};

function formatMonth(value: string | null): string {
  const [year, month] = (value ?? "").split("-");
  const name = MONTH_NAMES[Number(month) - 1];
  return year && name ? `${name} ${year}` : "";
}

function formatDates(role: WorkExperience): string {
  const start = formatMonth(role.start_date);
  const end = role.is_current ? "Present" : formatMonth(role.end_date);
  return [start, end].filter(Boolean).join(" – ");
}

const stripProtocol = (url: string): string =>
  url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");

function getContactLine(profile: Profile): string {
  return [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedin_url && stripProtocol(profile.linkedin_url),
    profile.portfolio_url && stripProtocol(profile.portfolio_url),
  ]
    .filter(Boolean)
    .join("  |  ");
}

function ResumeDocument({
  profile,
  content,
  density,
  onPageCount,
}: DocumentProps) {
  const styles = createStyles(density);
  const isCompact = density === "compact";
  const roles = getResumeRoles(profile);
  const { education } = profile;
  const skills = profile.skills.slice(0, MAX_SKILLS);

  return (
    <Document title={`${profile.full_name ?? "Resume"} - Resume`}>
      {/* In compact mode nothing may wrap onto a second page */}
      <Page size="A4" style={styles.page} wrap={!isCompact}>
        <Text style={styles.name}>{profile.full_name}</Text>
        {profile.current_title && (
          <Text style={styles.headline}>{profile.current_title}</Text>
        )}
        <Text style={styles.contact}>{getContactLine(profile)}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUMMARY</Text>
          <Text>{content.summary}</Text>
        </View>

        {roles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {roles.map((role, index) => {
              const bullets = content.roleBullets[index] ?? [];

              return (
                <View key={index} style={styles.role} wrap={false}>
                  <View style={styles.row}>
                    <Text style={styles.strong}>{role.title}</Text>
                    <Text style={styles.muted}>{formatDates(role)}</Text>
                  </View>
                  <Text style={styles.muted}>{role.company}</Text>
                  {bullets
                    .slice(0, isCompact ? COMPACT_BULLETS_PER_ROLE : undefined)
                    .map((bullet, bulletIndex) => (
                      <View key={bulletIndex} style={styles.bullet}>
                        <Text style={styles.bulletMark}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                </View>
              );
            })}
          </View>
        )}

        {education && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            <View style={styles.row}>
              <Text style={styles.strong}>
                {[education.degree, education.field_of_study]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
              <Text style={styles.muted}>{education.graduation_year}</Text>
            </View>
            <Text style={styles.muted}>{education.institution}</Text>
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <Text>{skills.join(", ")}</Text>
          </View>
        )}

        <Text
          fixed
          style={styles.pageCounter}
          render={({ totalPages }) => {
            onPageCount(totalPages);
            return "";
          }}
        />
      </Page>
    </Document>
  );
}

// Always one A4 page: a layout that spills is rendered again, tighter.
export async function renderResumePdf(
  profile: Profile,
  content: ResumeContent,
): Promise<Buffer> {
  let pageCount = 1;

  const regular = await renderToBuffer(
    <ResumeDocument
      profile={profile}
      content={content}
      density="regular"
      onPageCount={(count) => {
        pageCount = Math.max(pageCount, count);
      }}
    />,
  );

  if (pageCount === 1) {
    return regular;
  }

  return renderToBuffer(
    <ResumeDocument
      profile={profile}
      content={content}
      density="compact"
      onPageCount={() => undefined}
    />,
  );
}
