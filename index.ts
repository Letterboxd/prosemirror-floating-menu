import { MenuElement, renderGrouped } from 'prosemirror-menu'
import { EditorState, Plugin, PluginView } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export interface Options {
	/**
	 * The groups of `MenuElements` to show. This becomes the argument to `prosemirror-menu`'s `renderGrouped` function.
	 */
	content: readonly (readonly MenuElement[])[]

	/**
	 * Overrides the default placement of the selection menu into the DOM.
	 * @param view the `EditorView` where the selection was made
	 * @param menu the menu `HTMLElement`
	 */
	show?: (view: EditorView, menu: HTMLElement) => void

	/**
	 * Overrides the default remove of the selection menu from the DOM.
	 * @param menu the menu `HTMLElement`
	 */
	hide?: (menu: HTMLElement) => void

	/**
	 * A callback when the menu is shown.
	 * @param menu the menu `HTMLElement`
	 */
	onShow?: (menu: HTMLElement) => void

	/**
	 * A callback when the menu is hidden.
	 * @param menu the menu `HTMLElement`
	 * @returns 
	 */
	onHide?: (menu: HTMLElement) => void
	debounce?: number
}

function defaultShow(view: EditorView, menu: HTMLElement) {
	const selection = view.state.selection

	const start = view.coordsAtPos(selection.head)

	menu.style.display = ''

	const box = menu.offsetParent!.getBoundingClientRect()
	const { width, height } = menu.getBoundingClientRect()

	menu.style.left = `${Math.min(Math.max(box.left, Math.round(start.left - width / 2)), box.right - width)}px`
	menu.style.top = `${start.top - height - 3}px`
}

function defaultHide(menu:HTMLElement) {
	menu.style.display = 'none'
}

class SelectionMenuPluginView implements PluginView {

	private options: Options
	private dom: HTMLElement
	private menuUpdate: (state: EditorState) => boolean
	private debouncerTimeout?: NodeJS.Timeout

	public constructor(editorView: EditorView, options: Options) {
		this.options = options

		this.dom = document.createElement('div')
		this.dom.classList.add('ProseMirror-selectionmenu')
		this.dom.classList.add('ProseMirror-menubar')
		this.dom.style.position = 'absolute'
		editorView.dom.parentNode!.appendChild(this.dom)
		
		if (options.hide) {
			options.hide(this.dom)
		} else {
			defaultHide(this.dom)
		}

		const renderedMenu = renderGrouped(editorView, options.content)
		this.menuUpdate = renderedMenu.update
		this.dom.appendChild(renderedMenu.dom)
	}
	
	public update(view: EditorView, prevState: EditorState) {
		const state = view.state
		const selection = state.selection

		this.menuUpdate(state)

		if ((prevState.doc.eq(state.doc) && prevState.selection.eq(selection))) {
			return
		}

		if (selection.empty) {
			this.hideMenu()
		} else if (this.options.debounce) {
			if (this.debouncerTimeout) {
				clearTimeout(this.debouncerTimeout)
				this.hideMenu()
			}
			
			this.debouncerTimeout = setTimeout(this.showMenu.bind(this, view), this.options.debounce)
		} else {
			this.showMenu(view)
		}
	}

	public destroy() {
		this.hideMenu()
		this.dom.remove()
	}

	private showMenu(view: EditorView) {
		this.debouncerTimeout = undefined

		if (this.options.show) {
			this.options.show(view, this.dom)
		} else {
			defaultShow(view, this.dom)
		}

		if (this.options.onShow) {
			this.options.onShow(this.dom)
		}
	}

	private hideMenu() {
		if (this.options.hide) {
			this.options.hide(this.dom)
		} else {
			defaultHide(this.dom)
		}

		if (this.options.onHide) {
			this.options.onHide(this.dom)
		}
	}
	
}

export function selectionMenu(options: Options) {
	return new Plugin({
		view(editorView) {
			return new SelectionMenuPluginView(editorView, options)
		},
	})
}
