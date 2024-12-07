export interface SidebarProps {
  roleName: string;
  email: string;
  menuItems: {
    href: string;
    icon: any;
    label: string;
  }[];
}
