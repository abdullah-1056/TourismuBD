alter table public.reports
  add column if not exists reason_categories text[] not null default array[]::text[];

alter table public.reports
  drop constraint if exists reports_reason_categories_known_values;

alter table public.reports
  add constraint reports_reason_categories_known_values
  check (
    reason_categories <@ array[
      'Spam or scam',
      'Harassment or bullying',
      'Insulting or demeaning a person',
      'Hate speech',
      'Religious hate or disrespect',
      'Discrimination',
      'Violence or threats',
      'Adult or sexually explicit content',
      'Nudity or sexual content',
      'Self-harm or suicide',
      'False or misleading information',
      'Illegal activity',
      'Impersonation',
      'Privacy violation',
      'Copyright or intellectual property violation',
      'Other inappropriate content'
    ]::text[]
  );
