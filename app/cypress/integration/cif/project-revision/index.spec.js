import logAxeResults from "../../../plugins/logAxeResults";

describe("the new project page", () => {
  beforeEach(() => {
    cy.sqlFixture("e2e/dbReset");
    cy.sqlFixture("dev/001_cif_user");
    cy.sqlFixture("dev/002_cif_operator");
    cy.sqlFixture("dev/004_cif_contact");
  });

  it("renders the project overview form", () => {
    cy.mockLogin("cif_admin");

    cy.visit("/cif/projects");
    cy.get("button").contains("Add a Project").click();
    cy.url().should("include", "/cif/project-revision");
    cy.get("button").contains("Submit");
    cy.injectAxe();
    // TODO: the entire body should be tested for accessibility
    cy.checkA11y("main", null, logAxeResults);
    cy.get("body").happoScreenshot({
      component: "New Project Page",
      variant: "empty",
    });

    cy.get("input[id=search-dropdown-primaryContactForm_contactId]").click();
    //cy.contains('Loblaw003, Bob003').click();
    cy.get("[role=option]").contains("Loblaw003").click();

    // Bad practice
    // But this is a reported issue with mui-autocomplete https://github.com/cypress-io/cypress/issues/6716
    cy.wait(200);

    cy.get("button").contains("Add").click();
    cy.get("button").contains("Add").click();
    cy.get("button").contains("Add").click();
    cy.get('[placeholder="Select a Contact"]').should("have.length", 4);
  });

  it("properly displays validation errors", () => {
    cy.mockLogin("cif_admin");

    cy.visit("/cif/projects");
    cy.get("button").contains("Add a Project").click();
    cy.url().should("include", "/cif/project-revision");

    cy.get('#root_rfpNumber').type('1');
    cy.get("button").contains("Submit").click();
    cy.injectAxe();
    // Check error message accessibility
    cy.checkA11y(".error-detail", null, logAxeResults);
    cy.get("body").happoScreenshot({
      component: "Project Page with errors",
      variant: "empty",
    });
    cy.get('.error-detail').should("have.length", 8);
    // Renders a custom error message for a custom format validation error
    cy.get('.error-detail').first().should("contain", "random RFP digits should be 3 or 4 digits");
    // Renderes the default error message for a required field
    cy.get('.error-detail').last().should("contain", "is a required property");
  });
});
