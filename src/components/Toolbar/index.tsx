import "./index.css";
import { useContext, useEffect, useState } from "react";

import Search from "../Search";
import ToolbarButton from "../ToolbarButton";
import AppContext, { ViewMode } from "../../contexts/AppContext";
import useNodes from "../../hooks/useNodes";
import classnames from "classnames";

const toolbarOptions = [
  { viewMode: ViewMode.Cluster, iconName: "tb-nodes", title: "Nodes" },
  { viewMode: ViewMode.Heatmap, iconName: "tb-load", title: "TTFB" },
];

type ViewModeButtonsProps = {
  viewMode: ViewMode | undefined;
  toggleViewMode: () => void;
};

const ViewModeButtonsMobile = ({
  viewMode,
  toggleViewMode,
}: ViewModeButtonsProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const enabledViewMode = toolbarOptions.find((e) => e.viewMode === viewMode);
  const disabledViewModes = toolbarOptions.filter(
    (opt) => opt !== enabledViewMode
  );

  const handleClick = (mode: ViewMode) => {
    if (mode === viewMode && isCollapsed) {
      setIsCollapsed(false);
      return;
    }
    if (viewMode !== mode) {
      toggleViewMode();
    }
    setIsCollapsed(true);
  };

  const groupClassName = `Toolbar-buttonsGroup mobile ${
    isCollapsed && "collapsed"
  }`;
  return (
    <div className={groupClassName}>
      {enabledViewMode && (
        <div className={"Toolbar-button active"}>
          <ToolbarButton
            isActive={true}
            onClick={() => handleClick(enabledViewMode.viewMode)}
            iconName={enabledViewMode.iconName}
            title={enabledViewMode.title}
            subtitle={enabledViewMode.viewMode}
          />
        </div>
      )}
      {disabledViewModes.map((option) => {
        return (
          <div key={option.viewMode} className={"Toolbar-button"}>
            <ToolbarButton
              isActive={viewMode === option.viewMode}
              onClick={() => handleClick(option.viewMode)}
              iconName={option.iconName}
              title={option.title}
              subtitle={option.viewMode}
            />
          </div>
        );
      })}
    </div>
  );
};

const ViewModeButtonsWeb = ({
  viewMode,
  toggleViewMode,
}: ViewModeButtonsProps) => {
  const handleClick = (mode: ViewMode) => {
    if (mode !== viewMode) {
      toggleViewMode();
      return;
    }
  };

  return (
    <div className="Toolbar-buttonsGroup web">
      {toolbarOptions.map((option) => {
        return (
          <div key={option.viewMode} className={"Toolbar-button"}>
            <ToolbarButton
              isActive={viewMode === option.viewMode}
              onClick={() => handleClick(option.viewMode)}
              iconName={option.iconName}
              title={option.title}
              subtitle={option.viewMode}
            />
          </div>
        );
      })}
    </div>
  );
};

export const Toolbar = () => {
  const { viewMode, toggleViewMode } = useContext(AppContext);
  const { nodes } = useNodes();
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (nodes.length === 0 || isReady) return;
    setIsReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  const classname = classnames("Toolbar", { isReady });
  return (
    <nav className={classname}>
      <Search />
      <ViewModeButtonsMobile
        viewMode={viewMode}
        toggleViewMode={toggleViewMode}
      />
      <ViewModeButtonsWeb viewMode={viewMode} toggleViewMode={toggleViewMode} />
    </nav>
  );
};

export default Toolbar;
