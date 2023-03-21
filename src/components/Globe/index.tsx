import "mapbox-gl/dist/mapbox-gl.css";

import { Map, Source, useMap } from "react-map-gl";
//@ts-ignore
import mapboxgl from "mapbox-gl/dist/mapbox-gl";
//@ts-ignore
import MapboxWorker from "mapbox-gl/dist/mapbox-gl-csp-worker";
import { Node } from "../../hooks/useNodes";
import useAppContext from "../../hooks/useAppContext";
import { ViewMode } from "../../contexts/AppContext";
import Nodes from "../Layers/Nodes";
import Heatmap from "../Layers/Heatmap";
import Boundaries from "../Layers/Boundaries";
import { useCallback, useEffect } from "react";
import useContinents from "../../hooks/useContinents";
import useCountries from "../../hooks/useCountries";
mapboxgl.workerClass = MapboxWorker;

const viewState = {
  zoom: 1,
  longitude: -8.629105,
  latitude: 4.157944,
};

const projection = "globe";

const mapStyle = "mapbox://styles/joaoferreira18/cleedx6a6003x01qg41yehikx";

export const Globe = ({ nodes }: { nodes: Node[] }) => {
  const { map } = useMap();
  const { countries } = useCountries();
  const { continents } = useContinents();
  const { viewMode, hoverEntity, setHoverEntity } = useAppContext();

  const geoJson = {
    type: "FeatureCollection",
    features: nodes.map((node: Node) => ({
      type: "Feature",
      properties: {
        city: node.geoloc.city,
        country: node.geoloc.countryCode,
        continent: node.geoloc.continent.code,
        ttfb: node.ttfbStats.p95_24h,
      },
      geometry: {
        type: "Point",
        coordinates: node.geoloc.coordinates.split(",").reverse(),
      },
    })),
  };

  const onMouseLeave = useCallback(
    (options: any) => () => {
      if (options.id !== null) {
        map?.setFeatureState(
          {
            source: options.source,
            sourceLayer: options.sourceLayer,
            id: options.id,
          },
          { hover: false }
        );

        if (options.source === "boundaries") {
          map
            ?.querySourceFeatures("boundaries", {
              sourceLayer: "country_boundaries",
            })
            .forEach((feature) => {
              map.setFeatureState(
                {
                  source: options.source,
                  sourceLayer: options.sourceLayer,
                  id: feature.id,
                },
                {
                  nodes: options.boundariesLoad[feature.id as string],
                }
              );
            });
        }
      }

      options.id = null;
      setHoverEntity(undefined);
    },
    [map]
  );

  const onMouseMove = useCallback(
    (options: any) => (event: any) => {
      if (!event.features?.length || !map) return;

      const [feature] = event.features;
      const { id: nextId } = feature;

      if (options.source === "boundaries") {
        map
          ?.querySourceFeatures("boundaries", {
            sourceLayer: "country_boundaries",
          })
          .forEach((mapFeature) => {
            if (mapFeature.id !== nextId) {
              map.setFeatureState(
                {
                  source: options.source,
                  sourceLayer: options.sourceLayer,
                  id: mapFeature.id,
                },
                {
                  nodes: 0,
                }
              );
            }
          });

        setHoverEntity(
          countries.find(
            (country) => country.id === feature.properties.iso_3166_1
          )
        );
      }

      if (options.id !== null) {
        map.setFeatureState(
          {
            source: options.source,
            sourceLayer: options.sourceLayer,
            id: options.id,
          },
          { hover: false }
        );
      }

      options.id = nextId;

      map.setFeatureState(
        {
          source: options.source,
          sourceLayer: options.sourceLayer,
          id: nextId,
        },
        {
          hover: true,
          nodes: options.boundariesLoad && options.boundariesLoad[options.id],
        }
      );
    },
    [map]
  );

  const onMapLoad = useCallback(() => {
    if (!map) return;

    const boundariesLoad = map
      ?.querySourceFeatures("boundaries", {
        sourceLayer: "country_boundaries",
      })
      .reduce((acc, feature) => {
        const amountOfNodes = nodes.filter(
          (node: Node) =>
            node.geoloc.countryCode === feature.properties?.iso_3166_1
        ).length;

        map.setFeatureState(
          {
            source: "boundaries",
            sourceLayer: "country_boundaries",
            id: feature.id,
          },
          { hover: false, nodes: amountOfNodes }
        );

        return {
          ...acc,
          [feature.id as string]: amountOfNodes,
        };
      }, {});

    let hoveredStateId = null;

    const countryOptions = {
      id: hoveredStateId,
      source: "boundaries",
      sourceLayer: "country_boundaries",
      boundariesLoad,
    };

    map.on("mouseleave", "boundaries-fill", onMouseLeave(countryOptions));
    map.on("mousemove", "boundaries-fill", onMouseMove(countryOptions));
  }, [map, nodes, onMouseLeave, onMouseMove]);

  return (
    <Map
      id="map"
      mapLib={mapboxgl}
      onLoad={onMapLoad}
      mapStyle={mapStyle}
      projection={projection}
      initialViewState={viewState}
      mapboxAccessToken={process.env.REACT_APP_MAP_BOX_ACCESS_TOKEN}
    >
      {viewMode === ViewMode.Density && (
        <Source
          id="boundaries"
          type="vector"
          url="mapbox://mapbox.country-boundaries-v1"
          name="boundaries"
        >
          <Boundaries />
        </Source>
      )}

      {viewMode === ViewMode.Heatmap && (
        <Source
          id="heat-src"
          type="geojson"
          //@ts-ignore
          data={geoJson}
        >
          <Heatmap srcId="heat-src" />
        </Source>
      )}

      {viewMode === ViewMode.Cluster && (
        <Source
          id="nodes"
          type="geojson"
          //@ts-ignore
          data={geoJson}
          cluster={true}
          clusterRadius={20}
        >
          <Nodes srcId="nodes" />
        </Source>
      )}
    </Map>
  );
};

export default Globe;
