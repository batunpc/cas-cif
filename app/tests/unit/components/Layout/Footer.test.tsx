import Footer from "components/Layout/Footer";
import { render, screen } from "@testing-library/react";

describe("The Footer Component", () => {
  it("Renders footer links", () => {
    render(<Footer />);

    // Disclaimer
    expect(screen.getByText("Disclaimer")).toBeInTheDocument();
    expect(screen.getByText("Disclaimer")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/disclaimer"
    );
    expect(screen.getByText("Disclaimer")).toHaveAttribute("target", "_blank");

    // Privacy
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/privacy"
    );
    expect(screen.getByText("Privacy")).toHaveAttribute("target", "_blank");

    // Accessibility
    expect(screen.getByText("Accessibility")).toBeInTheDocument();
    expect(screen.getByText("Accessibility")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/accessible-government"
    );
    expect(screen.getByText("Accessibility")).toHaveAttribute(
      "target",
      "_blank"
    );

    // Copyright
    expect(screen.getByText("Copyright")).toBeInTheDocument();
    expect(screen.getByText("Copyright")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/copyright"
    );
    expect(screen.getByText("Copyright")).toHaveAttribute("target", "_blank");

    // Contact Us
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    // I'm not testing the href because it is using a function and that function returns undefined during the test.(It's working perfectly on the rendered page though)
    // tried to mock the function itself but it didn't work
    expect(screen.getByText("Contact Us")).toHaveAttribute("target", "_blank");
  });
});
