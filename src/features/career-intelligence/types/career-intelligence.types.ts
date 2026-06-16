export type {
  CareerRoadmap,
  CareerRoadmapDetail,
  RoadmapSkillItem,
  RoadmapCertificationItem,
  RoadmapProjectItem,
  RoadmapMilestone,
  RoadmapProgressData,
  SkillProgressItem,
  StudySession,
  CoachRecommendations,
  KnowledgeGraphData,
  AnalyticsDashboard,
  CreateRoadmapInput,
  RoadmapSkillInput,
  RoadmapCertInput,
  RoadmapProjectInput,
  MilestoneInput,
  UpsertSkillProgressInput,
  LogStudySessionInput,
} from '@shared/types/ipc.types'

export type RoadmapCategory = 'it' | 'cloud' | 'security' | 'development' | 'data' | 'management' | 'other'
export type RoadmapSeniority = 'entry' | 'junior' | 'mid' | 'senior' | 'expert'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type SkillImportance = 'critical' | 'important' | 'nice-to-have'

export const ROADMAP_CATEGORIES: Array<{ value: RoadmapCategory; label: string }> = [
  { value: 'it',          label: 'IT Support' },
  { value: 'cloud',       label: 'Cloud' },
  { value: 'security',    label: 'Security' },
  { value: 'development', label: 'Development' },
  { value: 'data',        label: 'Data' },
  { value: 'management',  label: 'Management' },
  { value: 'other',       label: 'Other' },
]

export const SENIORITY_LEVELS: Array<{ value: RoadmapSeniority; label: string }> = [
  { value: 'entry',  label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid',    label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'expert', label: 'Expert' },
]

export const SKILL_LEVELS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
  { value: 'expert',       label: 'Expert' },
]

export const IMPORTANCE_LEVELS: Array<{ value: SkillImportance; label: string }> = [
  { value: 'critical',     label: 'Critical' },
  { value: 'important',    label: 'Important' },
  { value: 'nice-to-have', label: 'Nice to Have' },
]

export const PREDEFINED_ROADMAPS: Array<{
  title: string
  category: RoadmapCategory
  seniority_level: RoadmapSeniority
  estimated_months: number
  description: string
  skills: Array<{ skill_name: string; target_level: SkillLevel; importance: SkillImportance }>
  certifications: Array<{ name: string; issuer: string; importance: SkillImportance }>
  projects: Array<{ title: string; description: string; importance: SkillImportance }>
  milestones: Array<{ title: string; description: string }>
}> = [
  {
    title: 'IT Support Engineer',
    category: 'it',
    seniority_level: 'entry',
    estimated_months: 6,
    description: 'Foundation role covering hardware, software, networking, and end-user support.',
    skills: [
      { skill_name: 'Windows OS', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Active Directory', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Networking Fundamentals', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Help Desk Support', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Office 365', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'PowerShell', target_level: 'beginner', importance: 'important' },
      { skill_name: 'ITIL Framework', target_level: 'beginner', importance: 'important' },
      { skill_name: 'Linux Basics', target_level: 'beginner', importance: 'nice-to-have' },
    ],
    certifications: [
      { name: 'CompTIA A+', issuer: 'CompTIA', importance: 'critical' },
      { name: 'CompTIA Network+', issuer: 'CompTIA', importance: 'important' },
      { name: 'Microsoft 365 Fundamentals (MS-900)', issuer: 'Microsoft', importance: 'important' },
    ],
    projects: [
      { title: 'Home Lab Setup', description: 'Build a home lab with Windows Server and AD DS', importance: 'critical' },
      { title: 'Ticketing System', description: 'Document 50+ resolved support tickets', importance: 'important' },
      { title: 'Network Diagram', description: 'Create a network diagram for a small business scenario', importance: 'important' },
    ],
    milestones: [
      { title: 'Complete A+ Certification', description: 'Pass CompTIA A+ Core 1 and Core 2 exams' },
      { title: 'Set up Home Lab', description: 'Windows Server with AD, DNS, DHCP configured' },
      { title: 'First Support Role', description: 'Land first IT Support position or internship' },
      { title: 'Complete Network+ Cert', description: 'Pass CompTIA Network+ exam' },
    ],
  },
  {
    title: 'MSP Technician',
    category: 'it',
    seniority_level: 'junior',
    estimated_months: 8,
    description: 'Managed Service Provider technician managing multiple client environments.',
    skills: [
      { skill_name: 'RMM Tools', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Windows Server', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Active Directory', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Office 365 Administration', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Backup & Recovery', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'PowerShell', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Networking', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'ITIL', target_level: 'intermediate', importance: 'important' },
    ],
    certifications: [
      { name: 'CompTIA A+', issuer: 'CompTIA', importance: 'critical' },
      { name: 'CompTIA Network+', issuer: 'CompTIA', importance: 'critical' },
      { name: 'Microsoft 365 Administrator (MS-102)', issuer: 'Microsoft', importance: 'important' },
    ],
    projects: [
      { title: 'Multi-tenant AD Management', description: 'Manage Active Directory for 5+ client environments', importance: 'critical' },
      { title: 'Backup Implementation', description: 'Implement and document a backup solution for a client', importance: 'important' },
    ],
    milestones: [
      { title: 'Master RMM Platform', description: 'Proficient in primary RMM tool used at MSP' },
      { title: 'Manage 10+ Clients', description: 'Independently manage 10+ client environments' },
      { title: 'Earn Microsoft 365 Cert', description: 'Pass MS-102 exam' },
    ],
  },
  {
    title: 'System Administrator',
    category: 'it',
    seniority_level: 'mid',
    estimated_months: 12,
    description: 'Manage and maintain servers, infrastructure, and enterprise IT systems.',
    skills: [
      { skill_name: 'Windows Server', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Active Directory', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'PowerShell', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Virtualization (Hyper-V/VMware)', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'DNS & DHCP', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Group Policy', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Linux Administration', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Backup & Disaster Recovery', target_level: 'intermediate', importance: 'important' },
    ],
    certifications: [
      { name: 'Microsoft Certified: Windows Server Hybrid Administrator', issuer: 'Microsoft', importance: 'critical' },
      { name: 'CompTIA Server+', issuer: 'CompTIA', importance: 'important' },
      { name: 'VMware VCP', issuer: 'VMware', importance: 'nice-to-have' },
    ],
    projects: [
      { title: 'Infrastructure Automation', description: 'Automate common admin tasks with PowerShell scripts', importance: 'critical' },
      { title: 'Disaster Recovery Plan', description: 'Design and test a full DR plan', importance: 'important' },
      { title: 'Virtualization Lab', description: 'Build a production-grade Hyper-V or VMware cluster', importance: 'important' },
    ],
    milestones: [
      { title: 'Automate 10 Admin Tasks', description: 'Write PowerShell scripts for 10 common tasks' },
      { title: 'Earn Windows Server Cert', description: 'Pass AZ-800 and AZ-801 exams' },
      { title: 'Lead a Migration Project', description: 'Lead an on-prem to cloud or server migration' },
    ],
  },
  {
    title: 'Azure Administrator',
    category: 'cloud',
    seniority_level: 'mid',
    estimated_months: 10,
    description: 'Design, implement, and manage Microsoft Azure cloud infrastructure.',
    skills: [
      { skill_name: 'Azure Virtual Machines', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Azure Active Directory', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Azure Networking', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Azure Storage', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Azure Monitor', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'PowerShell / Azure CLI', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'ARM Templates / Bicep', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Intune', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Azure Security Center', target_level: 'intermediate', importance: 'important' },
    ],
    certifications: [
      { name: 'AZ-104: Microsoft Azure Administrator', issuer: 'Microsoft', importance: 'critical' },
      { name: 'AZ-900: Azure Fundamentals', issuer: 'Microsoft', importance: 'important' },
      { name: 'AZ-500: Azure Security Technologies', issuer: 'Microsoft', importance: 'nice-to-have' },
    ],
    projects: [
      { title: 'Azure Landing Zone', description: 'Deploy a multi-subscription Azure landing zone', importance: 'critical' },
      { title: 'Infrastructure as Code', description: 'Deploy full environment using Bicep/ARM templates', importance: 'critical' },
      { title: 'Hybrid AD Setup', description: 'Configure Azure AD Connect with on-prem AD', importance: 'important' },
    ],
    milestones: [
      { title: 'Pass AZ-900', description: 'Foundation Azure certification' },
      { title: 'Deploy First Production Workload', description: 'Deploy and manage a production Azure workload' },
      { title: 'Pass AZ-104', description: 'Core Azure Administrator certification' },
      { title: 'Automate Azure Operations', description: 'Full infrastructure-as-code deployment pipeline' },
    ],
  },
  {
    title: 'Cyber Security Analyst',
    category: 'security',
    seniority_level: 'mid',
    estimated_months: 14,
    description: 'Protect organizational assets by monitoring, detecting, and responding to security threats.',
    skills: [
      { skill_name: 'Security Information & Event Management (SIEM)', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Network Security', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Incident Response', target_level: 'advanced', importance: 'critical' },
      { skill_name: 'Vulnerability Assessment', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Threat Intelligence', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Python / Scripting', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Penetration Testing Basics', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Compliance & Frameworks (NIST, ISO)', target_level: 'intermediate', importance: 'important' },
    ],
    certifications: [
      { name: 'CompTIA Security+', issuer: 'CompTIA', importance: 'critical' },
      { name: 'CompTIA CySA+', issuer: 'CompTIA', importance: 'critical' },
      { name: 'Microsoft SC-200 (Security Operations Analyst)', issuer: 'Microsoft', importance: 'important' },
      { name: 'CEH - Certified Ethical Hacker', issuer: 'EC-Council', importance: 'nice-to-have' },
    ],
    projects: [
      { title: 'Home Lab SIEM', description: 'Set up Splunk or Microsoft Sentinel for log analysis', importance: 'critical' },
      { title: 'CTF Challenges', description: 'Complete 10+ Capture The Flag challenges', importance: 'important' },
      { title: 'Vulnerability Scan Report', description: 'Run and document a full vulnerability assessment', importance: 'important' },
    ],
    milestones: [
      { title: 'Earn Security+', description: 'CompTIA Security+ certification' },
      { title: 'Build Home SIEM Lab', description: 'Set up and configure SIEM with real log sources' },
      { title: 'Earn CySA+', description: 'CompTIA Cybersecurity Analyst+ certification' },
      { title: 'First SOC Role', description: 'Land position as SOC Analyst or Security Analyst' },
    ],
  },
  {
    title: 'Cloud Support Engineer',
    category: 'cloud',
    seniority_level: 'junior',
    estimated_months: 9,
    description: 'Provide technical support and guidance for cloud services and migrations.',
    skills: [
      { skill_name: 'Azure or AWS Fundamentals', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Networking', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Windows Server', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'PowerShell / CLI', target_level: 'intermediate', importance: 'critical' },
      { skill_name: 'Identity & Access Management', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Cloud Storage', target_level: 'intermediate', importance: 'important' },
      { skill_name: 'Virtualization', target_level: 'beginner', importance: 'important' },
    ],
    certifications: [
      { name: 'AZ-900: Azure Fundamentals', issuer: 'Microsoft', importance: 'critical' },
      { name: 'CompTIA Cloud+', issuer: 'CompTIA', importance: 'important' },
    ],
    projects: [
      { title: 'Cloud Migration Simulation', description: 'Migrate a workload from on-prem to cloud', importance: 'critical' },
      { title: 'Cloud Cost Optimization', description: 'Analyze and optimize cloud spending for a demo environment', importance: 'important' },
    ],
    milestones: [
      { title: 'Earn Cloud Fundamentals Cert', description: 'AZ-900 or AWS Cloud Practitioner' },
      { title: 'Complete Migration Project', description: 'Successfully migrate a workload to cloud' },
    ],
  },
]
