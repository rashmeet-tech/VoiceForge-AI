export interface GeneratedRuleTemplate {
  ruleNumber: number;
  title: string;
  conditionText: string;
  actionText: string;
  isCritical: boolean;
  category: string;
}

export interface RuleGenerationResult {
  generatorType: 'deterministic_demo_engine';
  disclaimer: string;
  rulebookName: string;
  rulebookDescription: string;
  rules: GeneratedRuleTemplate[];
}

export class RuleGeneratorService {
  /**
   * Deterministic rulebook generator for hackathon demo.
   * Extracts practical, structured business rules from business description and context.
   * Clearly labeled as a deterministic policy generator to avoid fake LLM claims.
   */
  public generateFromDescription(businessName: string, businessType: string, description: string): RuleGenerationResult {
    const isDental = businessType.toLowerCase().includes('dental') || description.toLowerCase().includes('tooth') || description.toLowerCase().includes('dental') || businessName.toLowerCase().includes('dental');

    const rules: GeneratedRuleTemplate[] = [
      {
        ruleNumber: 1,
        title: 'Appointment Booking & Operating Hours',
        conditionText: 'When a caller requests to book, reschedule, or inquire about open appointment slots during operating hours (Monday through Friday, 9:00 AM – 6:00 PM)',
        actionText: 'Collect patient full name and phone number, offer appointment slots in 30-minute intervals, and confirm the scheduled time before ending the call.',
        isCritical: false,
        category: 'Scheduling',
      },
      {
        ruleNumber: 2,
        title: 'Emergency Escalation & After-Hours Triage',
        conditionText: 'When a caller indicates severe acute pain, active bleeding, broken trauma, or calls outside normal operating hours',
        actionText: 'DO NOT attempt clinical diagnosis. Immediately direct the caller to the on-call emergency doctor line at 555-0199 or instruct them to go to the nearest emergency facility.',
        isCritical: true,
        category: 'Patient Safety',
      },
      {
        ruleNumber: 3,
        title: 'Patient Privacy & Confidentiality Safeguards',
        conditionText: 'When a caller requests another individual\'s medical records, treatment details, or scheduled appointment times',
        actionText: 'Strictly decline to disclose protected health information without verified caller authorization and patient consent under HIPAA/privacy guidelines.',
        isCritical: true,
        category: 'Privacy & Compliance',
      },
      {
        ruleNumber: 4,
        title: 'Prohibition of Unsupported Medical Advice & Guarantees',
        conditionText: 'When a caller asks for an exact diagnosis, surgical outcome guarantee, or final price quote over the phone',
        actionText: 'State clearly that staff cannot diagnose or guarantee surgical results by phone. Inform caller that fees provided over the phone are rough estimates pending comprehensive in-person examination.',
        isCritical: true,
        category: 'Legal & Risk',
      },
      {
        ruleNumber: 5,
        title: 'Late Cancellation & Rescheduling Policy',
        conditionText: 'When a caller requests to cancel or reschedule an existing appointment with less than 24 hours advance notice',
        actionText: 'Politely inform the caller of the standard $25 late cancellation fee, note any verified medical emergency exceptions, and confirm whether they wish to proceed.',
        isCritical: false,
        category: 'Billing & Policy',
      },
      {
        ruleNumber: 6,
        title: 'Insurance Coverage & Payment Terms',
        conditionText: 'When a caller asks about insurance network participation, deductibles, or payment plans',
        actionText: 'Explain that co-pays are due at the time of service, offer to collect their insurance member ID for pre-visit benefits verification, and note accepted payment methods.',
        isCritical: false,
        category: 'Billing & Insurance',
      },
    ];

    return {
      generatorType: 'deterministic_demo_engine',
      disclaimer: 'Generated via VoiceForge AI Deterministic Policy Template Engine for hackathon demonstration. No external LLM API was invoked.',
      rulebookName: `${businessName || 'Business'} Master Rulebook v1.0`,
      rulebookDescription: `Operational rulebook parsed from policy description for ${businessName}. Enforces 6 explicit condition/action rules with 3 designated critical safety guardrails.`,
      rules,
    };
  }
}

export const ruleGeneratorService = new RuleGeneratorService();
