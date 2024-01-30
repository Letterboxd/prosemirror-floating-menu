# `prosemirror-selection-menu`

A plugin for displaying [`prosemirror-menu`](https://github.com/ProseMirror/prosemirror-menu) items in a floating menu above a selection.

This is sometimes referred to as a Medium-style floating menu. It is appropriate when you want a floating menu to appear above a selection in the editor,
rather than using a menu bar for your whole editor.

This module uses [`prosemirror-menu`](https://github.com/ProseMirror/prosemirror-menu) types and rendering to display the menu so you can repurpose
`MenuElement`s from a regular menu, including all of their rendering.

![Example image](https://github.com/Letterboxd/prosemirror-selection-menu/raw/main/etc/example.png)

## Example

An example assuming you have a schema containing `strong` and `em` marks.

```typescript
import { selectionMenu } from 'prosemirror-selection-menu'
import { EditorState, Plugin } from 'prosemirror-state'
import { icons, MenuElement, MenuItem } from 'prosemirror-menu'

const styleMenuItems: MenuElement[] = []
styleMenuItems.push(
	new MenuItem({
		label: 'Bold',
		icon: icons.strong,
		enable: (state) => toggleMark(schema.marks.strong)(state),
		run: toggleMark(schema.marks.strong),
		active(state) {
			return isMarkActive(state, schema.marks.strong)
		},
	})
)
styleMenuItems.push(
	new MenuItem({
		label: 'Italics',
		icon: icons.em,
		enable: (state) => toggleMark(schema.marks.em)(state),
		run: toggleMark(schema.marks.em),
		active(state) {
			return isMarkActive(state, schema.marks.em)
		},
	})
)

const plugins: Plugin[] = []
plugins.push(selectionMenu({
	content: [styleMenuItems],
})

const state = EditorState.create({
	schema,
	plugins,
	doc,
})
```

## Example using [`@floating-ui`](https://floating-ui.com/)

Combine this example with the configuration above to use [`@floating-ui`](https://floating-ui.com/) to position the floating menu smartly.

```typescript
import { autoUpdate, computePosition, flip, offset, shift, VirtualElement } from '@floating-ui/dom'

let selectionMenuAutoUpdateCleanup: (() => void) | undefined
plugins.push(selectionMenu({
	content: [styleMenuItems],
	show: function(view, dom) {
		const el: VirtualElement = {
			getBoundingClientRect: function() {
				const selection = view.state.selection

				const left = view.coordsAtPos(selection.head)
				const right = left

				return {
					x: left.left,
					y: left.top,
					width: right.right - left.left,
					height: right.bottom - right.top,
					left: left.left,
					right: right.right,
					top: left.top,
					bottom: right.bottom,
				}
			},
		}

		if (selectionMenuAutoUpdateCleanup) {
			selectionMenuAutoUpdateCleanup()
		}

		dom.style.display = ''

		selectionMenuAutoUpdateCleanup = autoUpdate(el, dom, () => {
			computePosition(el, dom, {
				placement: 'top',
				middleware: [
					offset(3),
					flip({
						crossAxis: false,
						padding: {
							top: 40,
						},
					}),
					shift({
						padding: {
							top: 3,
							bottom: 3,
							left: 3,
							right: 3,
						},
					}),
				],
			}).then((position) => {
				dom.style.left = `${position.x}px`
				dom.style.top = `${position.y}px`
			})
		})
	},
	onHide() {
		if (selectionMenuAutoUpdateCleanup) {
			selectionMenuAutoUpdateCleanup()
		}
	},
}))
```

## Development

I have followed the guide on https://www.sensedeep.com/blog/posts/2021/how-to-create-single-source-npm-module.html for setting
up the project for CommonJS and ESM.
