import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { LogoutButton } from "../Login/LogoutButton";

const Profile = () => {
  const { user, isAuthenticated } = useAuth0();

  return (
    isAuthenticated && (
      <div className="d-flex align-items-center bg-fondoClaro rounded-3 w-100 badge">
        <img
          className="img-fluid rounded me-2"
          src={user.picture}
          alt={user.name}
        />
        <div className="d-flex flex-lg-column justify-content-lg-center justify-content-around flex-fill align-items-center mb-lg-1 mb-0">
          {/* <p className="m-0 p-0 text-center flex-fill">{user.given_name}</p> */}
          <LogoutButton />
          <Link to="/admin" style={{ textDecoration: "none" }}>
            <button
              className="btn btn-outline-dottclaro d-flex align-items-center w-100"
              style={{
                height: "20px",
              }}
            >
              Administracion
            </button>
          </Link>
        </div>
      </div>
    )
  );
};

export default Profile;
