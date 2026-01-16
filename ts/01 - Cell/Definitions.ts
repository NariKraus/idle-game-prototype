// This file will act as the base static game data definitions for the Cell stage.
// It will be used to define types and interfaces for the Cell stage data structures.
// See /STAGE PLANNING/ARCHITECTURE.md for more information.

// Resource
interface Resource {
    name: string;
    displayName: string;
    description: string;
    baseMax: number;
    showBar: boolean;
    showInUI: boolean;
    order: number;
}

const createResource = (name: string, displayName: string, description: string, baseMax: number, showBar: boolean, showInUI: boolean, order: number): Resource => {
    return {
        name,
        displayName,
        description,
        baseMax,
        showBar,
        showInUI,
        order,
    };
};

type ResourceTuple = [string, string, string, number, boolean, boolean, number];
const RAW_RESOURCE_DATA: Record<string, ResourceTuple> = {
    atp: ['ATP', 'Adenosine Triphosphate', 'The primary energy carrier in all living organisms.', 100, true, true, 1],
    biomass: ['Biomass', 'Biomass', 'Organic material that makes up living organisms.', 100, true, true, 2],
    dna: ['DNA', 'Deoxyribonucleic Acid', 'The molecule that carries genetic instructions.', 100, false, true, 3],
    nutrients: ['Nutrients', 'Nutrients', 'Substances that provide nourishment essential for growth and maintenance.', 100, true, true, 4],
    waste: ['Waste', 'Waste', 'Byproducts of cellular processes that need to be expelled.', 500, true, true, 5],
};

export const RESOURCE_DEFINITIONS: Record<string, Resource> = Object.entries(RAW_RESOURCE_DATA).reduce((acc, [key, tuple]) => {
    acc[key] = createResource(...tuple);
    return acc;
}, {} as Record<string, Resource>);

console.log('RESOURCE_DEFINITIONS:', RESOURCE_DEFINITIONS);