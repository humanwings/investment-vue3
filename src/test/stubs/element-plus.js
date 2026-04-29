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
  ElButton: createStub('ElButton', 'button'),
  ElDescriptions: createStub('ElDescriptions'),
  ElDescriptionsItem: createStub('ElDescriptionsItem'),
  ElDialog: createStub('ElDialog'),
  ElForm: createStub('ElForm', 'form'),
  ElFormItem: createStub('ElFormItem'),
  ElIcon: createStub('ElIcon', 'span'),
  ElOption: createStub('ElOption'),
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
