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
  ElTag: createStub('ElTag', 'span')
}
