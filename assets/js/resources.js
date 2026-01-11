function flattenDefs(raw) {
  const flat = {};

  for (const layer in raw) {
    for (const key in raw[layer]) {
      const id = `${layer}.${key}`;
      flat[id] = raw[layer][key];
    }
  }

  return flat;
}

const RESOURCES_RAW = {
    cell: {
        
    }
}

const RESOURCES = flattenDefs(RESOURCES_RAW);
