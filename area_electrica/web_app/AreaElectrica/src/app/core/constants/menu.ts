import { MenuItem } from '../models/menu.model';

export class Menu {
  public static pages: MenuItem[] = [
    {
      group: 'Órdenes de Trabajo',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/folder.svg',
          label: 'Órdenes de Trabajo',
          route: '/orden/todas',
          children: [
            { label: 'Todas',       route: '/orden/todas'      },
            { label: 'En proceso',  route: '/orden/en-proceso' },
            { label: 'Finalizada',  route: '/orden/finalizada' },
            { label: 'Evaluada',    route: '/orden/evaluada'   },
          ],
        },
      ],
    },
    {
      group: 'Equipos',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/cog.svg',
          label: 'Equipos',
          route: '/admin/equipos',
        },
      ],
    },
    {
      group: 'Reportes',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          label: 'Reportes',
          route: '/reportes/uso-equipo',
          children: [
            { label: 'Uso de equipo', route: '/reportes/uso-equipo' },
          ],
        },
      ],
    },
    {
      group: 'Personal',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/users.svg',
          label: 'Personal',
          route: '/admin/personal',
          children: [
            { label: 'Técnicos', route: '/admin/tecnicos' },
            { label: 'Turnos',   route: '/admin/turnos'   },
          ],
        },
      ],
    },
    {
      group: 'Seguridad',
      separator: true,
      items: [
        {
          icon: 'assets/icons/heroicons/outline/shield-check.svg',
          label: 'Seguridad',
          route: '/admin/user',
          children: [
            { label: 'Usuarios',  route: '/admin/user' },
            { label: 'Roles',     route: '/admin/rol'  },
          ],
        },
      ],
    },
  ];
}
