type LocalSpecialist = {
  specialty?: string;
  city?: string;
  online_consultation?: boolean | string;
};

/** Bağlantı bölümü gizli; yerel sayfalar ve sitemap korunur. */
const LocalPagesLinks = <T extends LocalSpecialist>(_props: {
  specialists: T[];
  heading?: string;
  className?: string;
}) => null;

export default LocalPagesLinks;
