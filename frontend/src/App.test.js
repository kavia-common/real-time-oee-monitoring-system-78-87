import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders sign in when not authenticated", () => {
  render(<App />);
  const title = screen.getByText(/sign in/i);
  expect(title).toBeInTheDocument();
});
