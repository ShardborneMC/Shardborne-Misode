import type { CollectionRegistry, INode, ModelPath, SchemaRegistry } from '@mcschema/core'
import { Case, Mod, ObjectNode, Path, StringNode as RawStringNode, Switch, SwitchNode } from '@mcschema/core'
import type { LootContext } from '@mcschema/java-1.20/lib/LootContext.js'
import { LootConditions, LootEntitySources, LootTableTypes } from '@mcschema/java-1.20/lib/LootContext.js'
import { ConditionCases } from '../../common/common.js'

export function initLootTableSchemas(schemas: SchemaRegistry, collections: CollectionRegistry) {
	const StringNode = RawStringNode.bind(undefined, collections)

	function compileSwitchNode(
		contextMap: Map<string, LootContext[]>,
		collectionID: string,
		getNode: (type: string | string[]) => INode
	): INode {
		const cases: { match: (path: ModelPath) => boolean; node: INode }[] = []
		const getAvailableOptions = (providedContext: LootContext[]) =>
			collections.get(collectionID).filter((t) => {
				const requiredContext = contextMap.get(t) ?? []
				return requiredContext.every((c) => providedContext.includes(c))
			})
		for (const [tableType, { allows, requires }] of LootTableTypes) {
			const providedContext = [...allows, ...requires]

			cases.push({
				match: (path) => path.getModel().get(new Path(['type'])) === tableType,
				node: getNode(getAvailableOptions(providedContext)),
			})
		}
		cases.push({ match: (_) => true, node: getNode(collectionID) })
		return SwitchNode(cases)
	}
	LootConditions.set('shardborne:loot_condition', [])

	collections.register('loot_condition_type', [
		'minecraft:alternative',
		'minecraft:inverted',
		'minecraft:reference',
		'minecraft:entity_properties',
		'minecraft:block_state_property',
		'minecraft:match_tool',
		'minecraft:damage_source_properties',
		'minecraft:location_check',
		'minecraft:weather_check',
		'minecraft:time_check',
		'minecraft:entity_scores',
		'minecraft:random_chance',
		'minecraft:random_chance_with_looting',
		'minecraft:table_bonus',
		'minecraft:killed_by_player',
		'minecraft:survives_explosion',
		'shardborne:dungeon_level',
		'shardborne:dungeon_category',
	])

	const conditionIDSwtichNode = compileSwitchNode(LootConditions, 'loot_condition_type', (type) =>
		StringNode({
			validator: 'resource',
			params: { pool: type instanceof Array ? type : 'loot_condition_type' },
		})
	)

	const entitySourceSwtichNode = compileSwitchNode(LootEntitySources, 'entity_source', (type) =>
		StringNode({ enum: type })
	)

	schemas.register(
		'loot_condition',
		Mod(
			ObjectNode(
				{
					condition: conditionIDSwtichNode,
					[Switch]: [{ push: 'condition' }],
					[Case]: ConditionCases(entitySourceSwtichNode),
				},
				{ category: 'predicate', context: 'condition' }
			),
			{
				default: () => ({
					condition: 'minecraft:random_chance',
					chance: 0.5,
				}),
			}
		)
	)
}
