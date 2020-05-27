import { AbstractNode, NodeChildren, NodeMods, RenderOptions } from './AbstractNode'
import { TreeView } from '../view/TreeView'
import { Path } from '../model/Path'

export type IObject = {
  [name: string]: any
}

export class ObjectNode extends AbstractNode<IObject> {
  protected fields: NodeChildren

  constructor(fields: NodeChildren, mods?: NodeMods<IObject>) {
    super({
      default: () => ({}),
      ...mods})
    this.fields = fields
    Object.values(fields).forEach(child => {
      child.setParent(this)
    })
  }

  transform(path: Path, value: IObject) {
    if (value === undefined) return undefined
    value = value ?? {}
    let res: any = {}
    Object.keys(this.fields).forEach(f =>
      res[f] = this.fields[f].transform(path.push(f), value[f])
    )
    return res;
  }

  renderRaw(path: Path, value: IObject, view: TreeView, options?: RenderOptions) {
    value = value ?? {}
    return `${options?.hideLabel ? `` : `<label>${path.last()}:</label>
    <div style="padding-left:8px">`}
      ${Object.keys(this.fields).map(f => {
        return this.fields[f].render(path.push(f), value[f], view)
      }).join('')}
    ${options?.hideLabel ? `` : `</div>`}`
  }
}
