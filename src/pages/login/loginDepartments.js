import { CK_Dsh_Gujmarg, CK_Dsh_Gujrams, CK_Dsh_MMGSY } from '../../config/api.config';

const asset = (file) => `${import.meta.env.BASE_URL}rnb-login/${file}`;

export function getLoginDepartments() {
  return [
    {
      img: asset('map.png'),
      name: 'Map',
      text: 'Map Module provided by BISAG lets you explore all works on the map.',
      link: 'https://ris.ncog.gov.in/roadstatus/',
    },
    {
      img: asset('sathi.jpeg'),
      name: 'SATHI',
      text: 'SATHI is the HR application that maintains employee data.',
      link: 'https://sathi.gujarat.gov.in/irj/portal',
    },
    {
      img: asset('Pothole.jpeg'),
      name: 'GujMarg',
      text: 'Public complaints for roads and potholes; departments track resolution progress.',
      link: CK_Dsh_Gujmarg ? `${CK_Dsh_Gujmarg}/#/Dashboard/` : '',
    },
    {
      img: asset('GujRAMS.png'),
      name: 'GujRAMS',
      text: 'GujRAMS tracks and maintains road and bridge asset data.',
      link: CK_Dsh_Gujrams ? `${CK_Dsh_Gujrams}/Login` : '',
    },
    {
      img: asset('wms.png'),
      name: 'Work Management System',
      text: 'NIC WMS monitors work execution and progress across projects.',
      link: 'https://rnbwms.guj.nic.in/',
    },
    {
      img: asset('fms.jpeg'),
      name: 'Integrated Finance Management System',
      text: 'IFMS manages finances for the Roads & Buildings department.',
      link: 'https://ifms2.gujarat.gov.in/ifms/#/',
    },
    {
      img: asset('rpms.jpg'),
      name: 'RPMS',
      text: 'Road Progress Monitoring System for MMGSY panchayat works.',
      link: CK_Dsh_MMGSY ? `${CK_Dsh_MMGSY}/MMGSY/DashBoard.aspx` : '',
    },
  ];
}

export const LOGIN_CAROUSEL = {
  images: ['C1.jpg', 'C2.jpg', 'C3.jpg', 'C4.jpg'].map((f) => asset(f)),
  captions: [
    'Mahatma Mandir Convention and Exhibition Center',
    'Circuit House building at Somnath',
    'Mehsana – Himatnagar circle',
    'Cable bridge in Bhavnagar',
  ],
};

export const LOGIN_ASSETS = {
  heroBg: asset('BG2.jpg'),
  emblem: asset('emblem.jpg'),
  roadGif: asset('road.gif'),
};
