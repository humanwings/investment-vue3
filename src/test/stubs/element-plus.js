import { defineComponent, h } from 'vue'

function createStub(name, tag = 'div') {
  return defineComponent({
    name,
    props: {
      modelValue: {
        type: [String, Number, Boolean, Array, Object],
        default: undefined
      }
    },
    emits: ['update:modelValue', 'click', 'change'],
    setup(props, { emit, slots, attrs, expose }) {
      expose({
        validate: async () => true
      })

      return () =>
        h(
          tag,
          {
            ...attrs,
            onClick: (event) => emit('click', event)
          },
          slots.default?.()
        )
    }
  })
}

export const elementPlusStubs = {
  ElAlert: defineComponent({
    name: 'ElAlert',
    props: {
      title: {
        type: String,
        default: ''
      }
    },
    setup(props, { slots, attrs }) {
      return () => h('div', attrs, [props.title, slots.default?.()])
    }
  }),
  ElButton: createStub('ElButton', 'button'),
  ElCard: createStub('ElCard'),
  ElDescriptions: createStub('ElDescriptions'),
  ElDescriptionsItem: createStub('ElDescriptionsItem'),
  ElDialog: createStub('ElDialog'),
  ElForm: createStub('ElForm', 'form'),
  ElFormItem: createStub('ElFormItem'),
  ElIcon: createStub('ElIcon', 'span'),
  ElOption: defineComponent({
    name: 'ElOption',
    props: {
      label: {
        type: String,
        default: ''
      },
      value: {
        type: [String, Number, Boolean],
        default: ''
      }
    },
    setup(props, { attrs }) {
      return () =>
        h(
          'option',
          {
            ...attrs,
            value: props.value
          },
          props.label || props.value
        )
    }
  }),
  ElProgress: defineComponent({
    name: 'ElProgress',
    props: {
      percentage: {
        type: Number,
        default: 0
      }
    },
    setup(props, { attrs }) {
      return () => h('div', attrs, `${props.percentage}%`)
    }
  }),
  ElInput: defineComponent({
    name: 'ElInput',
    props: {
      modelValue: {
        type: [String, Number],
        default: ''
      }
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit, attrs }) {
      return () =>
        h('input', {
          ...attrs,
          value: props.modelValue,
          onInput: (event) => emit('update:modelValue', event.target.value),
          onChange: (event) => emit('change', event.target.value)
        })
    }
  }),
  ElInputNumber: defineComponent({
    name: 'ElInputNumber',
    props: {
      modelValue: {
        type: [String, Number],
        default: undefined
      }
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit, attrs }) {
      return () =>
        h('input', {
          ...attrs,
          type: 'number',
          value: props.modelValue,
          onInput: (event) =>
            emit('update:modelValue', Number(event.target.value)),
          onChange: (event) => emit('change', Number(event.target.value))
        })
    }
  }),
  ElSelect: defineComponent({
    name: 'ElSelect',
    props: {
      modelValue: {
        type: [String, Number, Boolean],
        default: ''
      }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, slots, attrs }) {
      return () =>
        h(
          'select',
          {
            ...attrs,
            value: props.modelValue,
            onChange: (event) => emit('update:modelValue', event.target.value)
          },
          slots.default?.()
        )
    }
  }),
  ElSwitch: defineComponent({
    name: 'ElSwitch',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () =>
        h('input', {
          ...attrs,
          type: 'checkbox',
          checked: props.modelValue,
          onChange: (event) => emit('update:modelValue', event.target.checked)
        })
    }
  }),
  ElTabPane: createStub('ElTabPane'),
  ElTable: createStub('ElTable'),
  ElTableColumn: defineComponent({
    name: 'ElTableColumn',
    setup(_, { slots }) {
      return () =>
        h('div', { class: 'el-table-column-stub' }, [
          slots.default?.({
            row: {},
            $index: 0
          })
        ])
    }
  }),
  ElTabs: createStub('ElTabs'),
  ElTag: createStub('ElTag', 'span')
}
