import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VibeMap from "../components/VibeMap";
import AttendeeFocus from "../components/AttendeeFocus";

describe("VibeMap", () => {
  const standCapacities = {
    NORTH: 50,
    SOUTH: 80,
    EAST: 30,
    WEST: 10,
  };

  it("renders stadium sections", () => {
    render(<VibeMap standCapacities={standCapacities} />);
    expect(screen.getByText(/NORTH STAND/i)).toBeInTheDocument();
    expect(screen.getByText(/SOUTH FANS/i)).toBeInTheDocument();
  });

  it("triggers onCellClick when a stand is clicked", () => {
    const onCellClick = vi.fn();
    render(<VibeMap standCapacities={standCapacities} onCellClick={onCellClick} />);
    
    // Find the North stand group (it has the label) and click it
    // Note: In VibeMap, the click handler is on the <g> containing the path and label.
    const northStand = screen.getByText(/NORTH STAND/i).closest('g');
    fireEvent.click(northStand);
    expect(onCellClick).toHaveBeenCalledWith("NORTH");
  });
});

describe("AttendeeFocus", () => {
  const proximities = {
    WASHROOM: { meters: 50, wait: "2 min", label: "Hub 1" },
    HYDRATION: { meters: 20, wait: "No wait", label: "Water 1" },
    FOOD: { meters: 100, wait: "10 min", label: "Food 1" },
  };

  it("renders proximity alerts", () => {
    const handleAction = vi.fn();
    render(<AttendeeFocus proximities={proximities} onAction={handleAction} />);
    expect(screen.getByText(/Washroom/i)).toBeInTheDocument();
    expect(screen.getByText(/50m/i)).toBeInTheDocument();
  });
});
