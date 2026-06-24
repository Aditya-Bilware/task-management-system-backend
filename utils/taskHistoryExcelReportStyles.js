const applyWorksheetStyles = (worksheet) => {
  worksheet.getRow(1).height = 35;
  worksheet.getRow(2).height = 28;

  worksheet.getCell("A1").font = {
    size: 22,
    bold: true,
  };

  worksheet.getCell("A2").font = {
    size: 15,
    bold: true,
  };

  worksheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  worksheet.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  ["A4", "A5", "A6", "A7", "A8"].forEach((cell) => {
    worksheet.getCell(cell).font = {
      bold: true,
      size: 11,
    };

    worksheet.getCell(cell).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  ["B4", "B5", "B6", "B7", "B8"].forEach((cell) => {
    worksheet.getCell(cell).font = {
      size: 11,
    };

    worksheet.getCell(cell).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
  });

  worksheet.getRow(4).height = 24;
  worksheet.getRow(5).height = 24;
  worksheet.getRow(6).height = 24;
  worksheet.getRow(7).height = 24;
  worksheet.getRow(8).height = 24;

  ["A4", "B4", "A5", "B5", "A6", "B6", "A7", "B7", "A8", "B8"].forEach(
    (cell) => {
      worksheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    },
  );

  const headerRow = worksheet.getRow(10);

  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: {
        argb: "FFFFFFFF",
      },
      size: 11,
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: "1E4FA8",
      },
    };

    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 10) return;

    row.height = 48;

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "DDDDDD" } },
        left: { style: "thin", color: { argb: "DDDDDD" } },
        bottom: { style: "thin", color: { argb: "DDDDDD" } },
        right: { style: "thin", color: { argb: "DDDDDD" } },
      };

      if (
        colNumber === 1 ||
        colNumber === 3 ||
        colNumber === 4 ||
        colNumber === 5 ||
        colNumber === 6 ||
        colNumber === 7
      ) {
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      } else {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };
      }
    });
  });
};

module.exports = {
  applyWorksheetStyles,
};
