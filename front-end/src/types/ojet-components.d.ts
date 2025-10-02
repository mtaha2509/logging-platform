declare namespace preact {
  namespace JSX {
    interface IntrinsicElements {
      'oj-panel': {
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-button': {
        chroming?: string;
        disabled?: boolean;
        onojAction?: () => void;
        class?: string;
        style?: string | object;
        children?: any;
        title?: string;
        [key: string]: any;
      };
      'oj-input-text': {
        id?: string;
        value?: string;
        onvalueChanged?: (event: any) => void;
        placeholder?: string;
        required?: boolean;
        class?: string;
        style?: string | object;
        [key: string]: any;
      };
      'oj-label': {
        for?: string;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-select-single': {
        id?: string;
        value?: string;
        onvalueChanged?: (event: any) => void;
        placeholder?: string;
        data?: any[];
        class?: string;
        style?: string | object;
        [key: string]: any;
      };
      'oj-form-layout': {
        direction?: string;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-toolbar': {
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-menu-button': {
        id?: string;
        display?: string;
        chroming?: string;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-menu': {
        id?: string;
        slot?: string;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-option': {
        id?: string;
        value?: string;
        onojAction?: () => void;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-badge': {
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-dialog': {
        id?: string;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-table': {
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
      'oj-navigation-list': {
        data?: any;
        onselectionChanged?: (event: any) => void;
        class?: string;
        style?: string | object;
        [key: string]: any;
      };
      'oj-datetime-picker': {
        id?: string;
        value?: string;
        onvalueChanged?: (event: any) => void;
        class?: string;
        style?: string | object;
        [key: string]: any;
      };
      'oj-checkbox-set': {
        id?: string;
        value?: string[];
        onvalueChanged?: (event: any) => void;
        class?: string;
        style?: string | object;
        children?: any;
        [key: string]: any;
      };
    }
  }
}
