import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";
import { MatchSimulationProvider } from "./hooks/useMatchSimulation.jsx";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MatchSimulationProvider>
        <App />
      </MatchSimulationProvider>
    </MemoryRouter>,
  );
}

describe("App", () => {
  it("mounts attendee home", () => {
    renderAt("/");
    expect(screen.getByText(/Your Location/i)).toBeInTheDocument();
  });

  it("mounts ops command", () => {
    renderAt("/ops");
    expect(screen.getByRole("heading", { name: /Ops Command/i })).toBeInTheDocument();
  });
});
