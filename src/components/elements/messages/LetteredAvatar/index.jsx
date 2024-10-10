// Copyright (c) https://github.com/ipavlyukov/react-lettered-avatar
// The MIT License
import React, { Component } from "react";
import PropTypes from "prop-types";

import { defaultColors } from "./colors";

import "./LetteredAvatar.css";

class LetteredAvatar extends Component {
  render() {
    const {
      name,
      color,
      backgroundColors,
      backgroundColor,
      radius,
      size,
    } = this.props;
    let initials = "",
      defaultBackground = "";

    const sumChars = (str) => {
      let sum = 0;
      for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
      }
      return sum;
    };

    // GET AND SET INITIALS
    const names = name.split(" ");
    if (names.length === 1) {
      initials = names[0].substring(0, 1).toUpperCase();
    } else if (names.length > 1) {
      names.forEach((n, i) => {
        initials += names[i].substring(0, 1).toUpperCase();
      });
    }

    // SET BACKGROUND COLOR
    if (/[A-Z]/.test(initials)) {
      if (backgroundColor) {
        defaultBackground = backgroundColor;
      } else {
        let colors = backgroundColors
        if (backgroundColors && backgroundColors.length) {
          colors = backgroundColors
        } else {
          colors = defaultColors
        }
        let i = sumChars(name) % colors.length
        defaultBackground = colors[i]
      }
    } else if (/[\d]/.test(initials)) {
      defaultBackground = defaultColors[parseInt(initials)];
    } else {
      defaultBackground = "#051923";
    }

    const fontSize = size / 2

    const styles = {
      color,
      backgroundColor: `${defaultBackground}`,
      width: size,
      height: size,
      lineHeight: `${size}px`,
      borderRadius: `${radius || radius === 0 ? radius : size}px`,
      fontSize: `100%`,
      fontWeight: 550,
    };
    return (
      <div
        className={`lettered-avatar-wrapper dark`}
        style={styles}
        aria-label={name}
      >
        <div className="lettered-avatar" style={{ fontSize, opacity: 0.6 }}>{initials}</div>
      </div>
    );
  }
}

LetteredAvatar.propTypes = {
  name: PropTypes.string.isRequired,
  color: PropTypes.string,
  backgroundColor: PropTypes.string,
  radius: PropTypes.number,
  size: PropTypes.number,
};

LetteredAvatar.defaultProps = {
  name: "Lettered Avatar",
  color: "",
  size: 48,
};

export default LetteredAvatar;
