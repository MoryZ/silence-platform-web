import SvgIcon from '@/components/common/svg-icon.vue';

declare module 'vue' {
  export interface GlobalComponents {
    SvgIcon: typeof SvgIcon;
  }
}

