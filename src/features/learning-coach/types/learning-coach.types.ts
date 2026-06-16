export type {
  LearningPath,
  LearningPathSkillItem,
  SkillMethodConfig,
  RetentionRecord,
  ReviewLog,
  StudyPlan,
  StudyPlanItem,
  SkillDependencyItem,
  LearningCoachDependencyGraph,
  LearningEffectivenessMetrics,
  CreateLearningPathInput,
  LearningPathSkillInput,
  GenerateStudyPlanInput,
} from '@shared/types/ipc.types'

export type PathCategory = 'it-support' | 'msp' | 'sysadmin' | 'azure-admin' | 'cloud-support' | 'cyber-security' | 'custom'
export type SeniorityLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead'
export type PlanType = 'daily' | 'weekly' | 'monthly'
export type DependencyStrength = 'required' | 'recommended' | 'optional'
export type LearningMethod = 'home-lab' | 'notes' | 'videos' | 'active-recall' | 'flashcards' | 'interview-questions' | 'projects'

export const PATH_CATEGORIES: Array<{ value: PathCategory; label: string }> = [
  { value: 'it-support',    label: 'IT Support'       },
  { value: 'msp',           label: 'MSP Technician'   },
  { value: 'sysadmin',      label: 'System Admin'     },
  { value: 'azure-admin',   label: 'Azure Admin'      },
  { value: 'cloud-support', label: 'Cloud Support'    },
  { value: 'cyber-security',label: 'Cyber Security'   },
  { value: 'custom',        label: 'Custom'           },
]

export const SENIORITY_LEVELS: Array<{ value: SeniorityLevel; label: string }> = [
  { value: 'entry',  label: 'Entry Level'  },
  { value: 'junior', label: 'Junior'       },
  { value: 'mid',    label: 'Mid Level'    },
  { value: 'senior', label: 'Senior'       },
  { value: 'lead',   label: 'Lead'         },
]

export const LEARNING_METHODS: Array<{ value: LearningMethod; label: string; color: string; icon: string }> = [
  { value: 'home-lab',            label: 'Home Lab',            color: '#22C55E', icon: '🔬' },
  { value: 'notes',               label: 'Notes',               color: '#3B82F6', icon: '📝' },
  { value: 'videos',              label: 'Videos',              color: '#EF4444', icon: '▶️' },
  { value: 'active-recall',       label: 'Active Recall',       color: '#F59E0B', icon: '🧠' },
  { value: 'flashcards',          label: 'Flashcards',          color: '#8B5CF6', icon: '🃏' },
  { value: 'interview-questions', label: 'Interview Qs',        color: '#EC4899', icon: '💬' },
  { value: 'projects',            label: 'Projects',            color: '#06B6D4', icon: '🚀' },
]

export const PREDEFINED_LEARNING_PATHS: Array<{
  title: string
  career_goal: string
  category: PathCategory
  seniority_level: SeniorityLevel
  estimated_weeks: number
  available_hours_per_week: number
  description: string
  skills: Array<{
    skill_name: string
    why_it_matters: string
    prerequisites_json: string
    estimated_hours: number
    target_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  }>
}> = [
  {
    title: 'IT Support Engineer Path',
    career_goal: 'Become job-ready IT Support / Helpdesk Engineer',
    category: 'it-support',
    seniority_level: 'entry',
    estimated_weeks: 16,
    available_hours_per_week: 10,
    description: 'Structured path from zero to ready for L1/L2 IT support roles in MSP or corporate environments.',
    skills: [
      { skill_name: 'CompTIA A+',             why_it_matters: 'Industry baseline certification covering hardware, OS, troubleshooting. Required by most employers.',                 prerequisites_json: '[]',                                   estimated_hours: 40, target_level: 'intermediate' },
      { skill_name: 'Networking Fundamentals', why_it_matters: 'You cannot troubleshoot connectivity without understanding TCP/IP, subnetting, DNS, and DHCP.',                     prerequisites_json: '[]',                                   estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Windows 10/11',          why_it_matters: '90% of helpdesk calls involve Windows. OS navigation, settings, and registry basics are non-negotiable.',          prerequisites_json: '["CompTIA A+"]',                       estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'Active Directory',       why_it_matters: 'Every corporate environment uses AD. User management, groups, and GPO basics are asked in every interview.',       prerequisites_json: '["Networking Fundamentals"]',          estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'PowerShell Basics',      why_it_matters: 'Automate repetitive helpdesk tasks. Pipeline, cmdlets, and AD commands separate good techs from great ones.',      prerequisites_json: '["Windows 10/11","Active Directory"]', estimated_hours: 20, target_level: 'beginner'     },
      { skill_name: 'Microsoft 365',          why_it_matters: 'Most SMBs run M365. Email, Teams, SharePoint admin are daily helpdesk responsibilities.',                          prerequisites_json: '["Active Directory"]',                 estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'ITIL Service Management',why_it_matters: 'Ticket management, SLAs, escalation procedures. ITIL Foundation shows employers you understand service delivery.',  prerequisites_json: '["CompTIA A+"]',                       estimated_hours: 15, target_level: 'beginner'     },
      { skill_name: 'Remote Support Tools',   why_it_matters: 'TeamViewer, ConnectWise Control, RDP. Remote access is how modern helpdesk operates.',                             prerequisites_json: '["Windows 10/11"]',                   estimated_hours: 8,  target_level: 'intermediate' },
    ],
  },
  {
    title: 'MSP Technician Path',
    career_goal: 'Become a skilled Managed Service Provider technician',
    category: 'msp',
    seniority_level: 'junior',
    estimated_weeks: 20,
    available_hours_per_week: 12,
    description: 'Deep MSP-focused learning path covering multi-tenant management, RMM, PSA tools, and client-facing skills.',
    skills: [
      { skill_name: 'Networking Fundamentals', why_it_matters: 'MSP technicians manage infrastructure across dozens of clients. Solid networking is the foundation.',               prerequisites_json: '[]',                                   estimated_hours: 30, target_level: 'advanced'     },
      { skill_name: 'Windows Server',          why_it_matters: 'Most MSP clients run Windows Server. AD, DNS, DHCP, file server management are core responsibilities.',            prerequisites_json: '["Networking Fundamentals"]',          estimated_hours: 40, target_level: 'intermediate' },
      { skill_name: 'Active Directory',        why_it_matters: 'Multi-tenant AD management — different forests, trusts, GPOs per client. Critical MSP skill.',                     prerequisites_json: '["Windows Server"]',                   estimated_hours: 35, target_level: 'advanced'     },
      { skill_name: 'Microsoft 365',           why_it_matters: 'MSPs manage M365 tenants for multiple clients. Exchange, SharePoint, Teams, Intune are daily tools.',              prerequisites_json: '["Active Directory"]',                 estimated_hours: 30, target_level: 'advanced'     },
      { skill_name: 'Azure AD / Entra ID',    why_it_matters: 'Hybrid identity, Conditional Access, MFA. Every MSP client is moving to cloud identity.',                           prerequisites_json: '["Active Directory","Microsoft 365"]', estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'PowerShell',             why_it_matters: 'Automation is how MSPs scale. Scripts for user onboarding, reporting, and bulk operations across client tenants.',  prerequisites_json: '["Active Directory"]',                 estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Backup & DR',            why_it_matters: 'RTO and RPO matter. Understanding Veeam, Datto, or similar tools is a differentiator in MSP interviews.',          prerequisites_json: '["Windows Server"]',                   estimated_hours: 15, target_level: 'intermediate' },
      { skill_name: 'Cybersecurity Basics',   why_it_matters: 'MSPs are responsible for client security posture. Understand threats, MFA, endpoint protection, phishing defence.',prerequisites_json: '["Microsoft 365","Active Directory"]', estimated_hours: 20, target_level: 'intermediate' },
    ],
  },
  {
    title: 'System Administrator Path',
    career_goal: 'Become a proficient Windows System Administrator',
    category: 'sysadmin',
    seniority_level: 'mid',
    estimated_weeks: 24,
    available_hours_per_week: 12,
    description: 'Comprehensive path for Windows SysAdmin roles covering infrastructure management, automation, and enterprise services.',
    skills: [
      { skill_name: 'Windows Server',         why_it_matters: 'Core platform for SysAdmin work. ADDS, DNS, DHCP, IIS, Print Server, File Server.',                                prerequisites_json: '[]',                                                   estimated_hours: 50, target_level: 'advanced'     },
      { skill_name: 'Active Directory',       why_it_matters: 'Enterprise AD management — Sites, OU design, GPO strategy, privileged access, trust relationships.',               prerequisites_json: '["Windows Server"]',                                   estimated_hours: 45, target_level: 'advanced'     },
      { skill_name: 'PowerShell',             why_it_matters: 'SysAdmins must automate. DSC, Remoting, Scheduled Tasks, bulk user management, server reporting.',                 prerequisites_json: '["Active Directory"]',                                 estimated_hours: 40, target_level: 'advanced'     },
      { skill_name: 'Networking',             why_it_matters: 'VLANs, routing, firewall rules. SysAdmins work closely with network teams and must understand the stack.',          prerequisites_json: '[]',                                                   estimated_hours: 30, target_level: 'advanced'     },
      { skill_name: 'Virtualisation',         why_it_matters: 'Hyper-V or VMware. Server consolidation, snapshots, HA clustering — fundamental in enterprise environments.',      prerequisites_json: '["Windows Server"]',                                   estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Microsoft Azure',        why_it_matters: 'Hybrid environments are everywhere. Azure AD Connect, VPN gateways, Azure Backup, and Azure Files.',                prerequisites_json: '["Active Directory","Networking"]',                    estimated_hours: 35, target_level: 'intermediate' },
      { skill_name: 'Security & Hardening',   why_it_matters: 'CIS Benchmarks, Windows Defender ATP, audit policies, privilege escalation prevention.',                           prerequisites_json: '["Active Directory","PowerShell"]',                    estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'Backup & Recovery',      why_it_matters: 'Windows Server Backup, DFS Replication, disaster recovery runbooks. Data protection is a SysAdmin obligation.',    prerequisites_json: '["Windows Server","Virtualisation"]',                  estimated_hours: 20, target_level: 'intermediate' },
    ],
  },
  {
    title: 'Azure Administrator Path',
    career_goal: 'Pass AZ-104 and become an Azure Administrator',
    category: 'azure-admin',
    seniority_level: 'mid',
    estimated_weeks: 20,
    available_hours_per_week: 14,
    description: 'Structured path aligned with the AZ-104 exam domains: identity, governance, storage, compute, networking, and monitoring.',
    skills: [
      { skill_name: 'Azure Identity & Access', why_it_matters: 'Azure AD, RBAC, Privileged Identity Management. 15-20% of AZ-104. Foundational to everything else.',             prerequisites_json: '[]',                                                             estimated_hours: 30, target_level: 'advanced'     },
      { skill_name: 'Azure Governance',        why_it_matters: 'Management Groups, Subscriptions, Policies, Blueprints, Tags, Cost Management. Required for any Azure role.',      prerequisites_json: '["Azure Identity & Access"]',                                    estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'Azure Storage',           why_it_matters: 'Blob, File, Queue, Table, Managed Disks. Storage accounts, replication, access tiers, lifecycle policies.',       prerequisites_json: '["Azure Identity & Access"]',                                    estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'Azure Virtual Machines',  why_it_matters: 'VM sizing, availability sets, scale sets, extensions, backups, monitoring. Core compute for AZ-104.',             prerequisites_json: '["Azure Storage"]',                                              estimated_hours: 30, target_level: 'advanced'     },
      { skill_name: 'Azure Networking',        why_it_matters: 'VNets, subnets, NSGs, peering, VPN Gateway, ExpressRoute, Load Balancer, Application Gateway, DNS.',              prerequisites_json: '["Azure Virtual Machines"]',                                     estimated_hours: 35, target_level: 'advanced'     },
      { skill_name: 'Azure App Services',      why_it_matters: 'PaaS hosting for web apps. Deployment slots, auto-scaling, App Service Plans.',                                   prerequisites_json: '["Azure Networking"]',                                            estimated_hours: 15, target_level: 'intermediate' },
      { skill_name: 'Azure Monitor & Alerts',  why_it_matters: 'Log Analytics, Metrics, Dashboards, Action Groups. You cannot manage what you cannot see.',                       prerequisites_json: '["Azure Virtual Machines","Azure Networking"]',                   estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'Azure Backup & Recovery', why_it_matters: 'Recovery Services Vault, Azure Site Recovery, soft deletes. Business continuity is an admin responsibility.',     prerequisites_json: '["Azure Virtual Machines","Azure Storage"]',                      estimated_hours: 15, target_level: 'intermediate' },
    ],
  },
  {
    title: 'Cloud Support Engineer Path',
    career_goal: 'Become a Cloud Support Engineer (Azure/AWS)',
    category: 'cloud-support',
    seniority_level: 'junior',
    estimated_weeks: 18,
    available_hours_per_week: 12,
    description: 'Cloud support engineering combines infrastructure knowledge with customer-facing skills and cloud platform expertise.',
    skills: [
      { skill_name: 'Networking Fundamentals', why_it_matters: 'Cloud support tickets are 40% networking. TCP/IP, DNS, routing, load balancing, firewalls.',                      prerequisites_json: '[]',                                              estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Linux Administration',    why_it_matters: 'Most cloud VMs run Linux. SSH, systemd, cron, logs, disk management, package managers.',                         prerequisites_json: '["Networking Fundamentals"]',                     estimated_hours: 35, target_level: 'intermediate' },
      { skill_name: 'Azure Fundamentals',      why_it_matters: 'AZ-900 level knowledge. Core services, pricing, SLAs, support tiers.',                                           prerequisites_json: '["Networking Fundamentals"]',                     estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'Azure Networking',        why_it_matters: 'VNets, NSGs, VPN Gateway, ExpressRoute. Connectivity issues are the #1 cloud support category.',                  prerequisites_json: '["Azure Fundamentals","Networking Fundamentals"]', estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Azure Storage',           why_it_matters: 'Access control, replication, connectivity to storage. Common support escalation area.',                           prerequisites_json: '["Azure Fundamentals"]',                          estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'PowerShell / CLI',        why_it_matters: 'Diagnose and automate with Azure PowerShell and Azure CLI. Essential for support engineers.',                     prerequisites_json: '["Azure Fundamentals"]',                          estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'Monitoring & Diagnostics',why_it_matters: 'Azure Monitor, Log Analytics, boot diagnostics, NSG flow logs. Finding root cause fast.',                        prerequisites_json: '["Azure Networking","Azure Storage"]',            estimated_hours: 20, target_level: 'intermediate' },
    ],
  },
  {
    title: 'Cyber Security Analyst Path',
    career_goal: 'Become a SOC Analyst / Cyber Security Analyst',
    category: 'cyber-security',
    seniority_level: 'mid',
    estimated_weeks: 28,
    available_hours_per_week: 14,
    description: 'Defensive security path covering threat analysis, SIEM operations, incident response, and security frameworks.',
    skills: [
      { skill_name: 'Networking Security',    why_it_matters: 'Packet analysis, firewall rules, IDS/IPS, VPN, zero trust. Security analysts must deeply understand the network.', prerequisites_json: '[]',                                                         estimated_hours: 35, target_level: 'advanced'     },
      { skill_name: 'Security Fundamentals',  why_it_matters: 'CIA triad, threat models, attack vectors, vulnerability management. CompTIA Security+ covers this foundation.',    prerequisites_json: '["Networking Security"]',                                    estimated_hours: 40, target_level: 'intermediate' },
      { skill_name: 'SIEM & Log Analysis',    why_it_matters: 'Microsoft Sentinel, Splunk, QRadar. Writing KQL queries, correlation rules, alert tuning — core SOC work.',       prerequisites_json: '["Security Fundamentals"]',                                  estimated_hours: 45, target_level: 'advanced'     },
      { skill_name: 'Incident Response',      why_it_matters: 'Detection, containment, eradication, recovery. Playbooks, chain of custody, forensic basics.',                    prerequisites_json: '["SIEM & Log Analysis"]',                                    estimated_hours: 30, target_level: 'intermediate' },
      { skill_name: 'Identity Security',      why_it_matters: 'Azure AD PIM, privileged access, lateral movement detection. Identity is the new perimeter.',                     prerequisites_json: '["Security Fundamentals","SIEM & Log Analysis"]',            estimated_hours: 25, target_level: 'intermediate' },
      { skill_name: 'Threat Intelligence',    why_it_matters: 'MITRE ATT&CK framework, IOCs, threat actor TTPs. Proactive defence requires knowing the adversary.',              prerequisites_json: '["Incident Response"]',                                      estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'Vulnerability Management',why_it_matters: 'Qualys, Tenable, Defender Vulnerability Management. Prioritising and remediating CVEs.',                         prerequisites_json: '["Security Fundamentals","Identity Security"]',               estimated_hours: 20, target_level: 'intermediate' },
      { skill_name: 'Compliance & Frameworks',why_it_matters: 'ISO 27001, NIST, CIS Controls, SOC 2. Security analysts work within compliance frameworks daily.',                prerequisites_json: '["Incident Response","Vulnerability Management"]',           estimated_hours: 20, target_level: 'beginner'     },
    ],
  },
]
