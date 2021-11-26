import Image from "next/image";
import Button from "@button-inc/bcgov-theme/Button";
import { BaseNavigation } from "@button-inc/bcgov-theme/Navigation";
import { BaseHeader } from "@button-inc/bcgov-theme/Header";
import LoginForm from "components/LoginForm";

interface Props {
  isLoggedIn?: boolean;
  children?: React.ReactNode;
  title?: string;
  userProfileDropdown?: React.ReactNode;
}

const Navigation: React.FC<Props> = ({
  isLoggedIn = false,
  title = "cif",
  userProfileDropdown,
}) => {
  let rightSide = isLoggedIn ? (
    userProfileDropdown
  ) : (
    <LoginForm>
      <Button variant="secondary-inverse" type="submit">
        Login
      </Button>
    </LoginForm>
  );
  return (
    <>
      <BaseNavigation>
        <BaseHeader>
          <BaseHeader.Group className="banner">
            {/*
              We don't want a front end navigation here,
              to ensure that a back-end redirect is performed when clicking on the banner image
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages*/}
            <a href="/">
              <Image
                src="/img/BCID_CleanBC_rev_tagline_colour.svg"
                alt="logo for Province of British Columbia CleanBC"
                height={50}
                width={300}
              />
            </a>
          </BaseHeader.Group>
          <BaseHeader.Item collapse="900">
            <h1>{title}</h1>
          </BaseHeader.Item>
          <BaseHeader.Group
            style={{
              marginLeft: "auto",
              marginBottom: "auto",
              marginTop: "auto",
            }}
          >
            {rightSide}
          </BaseHeader.Group>
        </BaseHeader>
      </BaseNavigation>
      <style jsx>{`
        h1 {
          font-weight: normal;
          margin-top: 10px;
        }
      `}</style>
    </>
  );
};

export default Navigation;
