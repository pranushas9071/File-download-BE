const PdfPrinter = require('pdfmake');
const path = require('path');
const fs = require('fs');

const fonts = {
    Roboto: {
        normal: 'src/fonts/Roboto-Regular.ttf',
        bold: 'src/fonts/Roboto-Medium.ttf',
        italics: 'src/fonts/Roboto-Italic.ttf',
        bolditalics: 'src/fonts/Roboto-MediumItalic.ttf'
    }
};

class PDFWriter {
    constructor() {
        this.table = []; // ddefault table properties for the table body.
        this.rows = []; // rows for the pdf file.
        this.sheetIndex = 0;
        this.docDefinition = {
            content: [],
            styles: {},
        }; // default document definition initialized.
        this.default = {
            grid: 'grid',
            gridHeader: 'gridHeader',
            rowGroup: 'rowGroup',
            layout: 'lightHorizontalLines',
            sheetName: 'sheetName',
            subHeader: 'subHeader',
            tableWidths: ['auto', 90, 90, 90],
            padding: 15,
            headerRows: 1,
            childStyles: {},
        };  // default style intialized for the table properties.
    }

    // set header for the pdf file .
    // the return object text: header , style: header style.
    setHeader(header) {
        const tableHeader = header.map((value) => {
            if (typeof value === "string") {
                return {
                    text: value,
                    style: this.default.gridHeader,
                };
            } else if (typeof value === "object") {
                return {
                    text: value.name,
                    style: this.default.gridHeader,
                };
            }
        });

        return tableHeader;
    }

    // add the row value in the rows array.
    doAddRow(data, level) {
        data.forEach((row) => {
            if (row.hasOwnProperty('child')) {

                let deepCopiedRow = JSON.parse(JSON.stringify(row)); // to take the deep of the object.
                delete deepCopiedRow.child; // deleting the child property before pushing to the row.
                deepCopiedRow.outline = level; // to set outline padding level.
                deepCopiedRow.parent = true; // to set style for parent.
                this.rows.push(deepCopiedRow);
                this.doAddRow(row.child, level + 1);  // recursively called if the row has the child proprty.

            } else if (!row.hasOwnProperty('child')) {
                if (level) {
                    row.outline = level;
                }
                row.parent = false; // to set style for child.
                this.rows.push(row);

            }
        });

    }

    // set the padding for the header rows and styles for the child.
    setOutlineStyle(row) {
        if (row.parent) {
            return {
                margin: [row.outline * this.default.padding, 0, 0, 0],
                bold: true,
                color: 'black',
            }
        } else if (!row.parent) {
            return {
                margin: [row.outline * this.default.padding, 0, 0, 0],
            }
        }
    }

    // set outline level styles for the nested rows and child.
    setOutline() {
        this.rows.map((row) => {

            if (row.parent && !row.outline) {
                row.style = this.default.subHeader;

            } else if (row.parent && row.outline) {
                row.style = `parent${row.outline}`;
                this.default.childStyles[`parent${row.outline}`] = this.setOutlineStyle(row);

            } else if (!row.parent && row.outline) {
                row.style = `child${row.outline}`;
                this.default.childStyles[`child${row.outline}`] = this.setOutlineStyle(row);

            } else {
                row.style = '';
            }
            return row;
        });
    }

    // format the row values from array of objects into array of strings for rows.
    formatRow(rows) {
        const formattedRows = [];
        rows.forEach((row) => {
            const rowCell = this.setRowCell(this.table[this.sheetIndex].info.header, row);
            formattedRows.push(rowCell);
        });
        return formattedRows;
    }

    // set the table style.
    setTableStyle() {
        return {
            grid: {
                margin: [40, 5, 0, 15]
            },
            gridHeader: {
                bold: true,
                fontSize: 13,
                color: 'black'
            },
            rowGroup: {
                margin: [20, 0, 0, 0],
            },
            subHeader: {
                bold: true,
                color: 'black',
            },
            sheetName: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            ...this.default.childStyles,
        }
    }

    // set cell value for each row.
    setRowCell(header, row) {
        const rowCell = [];
        header.map((headerval) => {
            return headerval.key;
        }).forEach((key) => {
            if (Object.keys(row).includes(key)) {
                rowCell.push({ text: row[key], style: key === 'name' ? row['style'] : '' });
            }
        });
        return rowCell;
    }

    // set the rows values for the table.
    setRow(data) {
        if (this.rows && this.rows.length) {
            this.rows = [];
        }

        this.doAddRow(data, 0);
        this.setOutline();
        this.rows = this.formatRow(this.rows);
        return this.rows;
    }

    // set the default value and invoked when the input  data is an object.
    setDefault() {
        this.docDefinition = [{
            style: this.default.grid,
            table: this.setTable(),
            layout: this.default.layout
        }];
    }

    //set the table properties for the content to create the document definition.
    setTable(table = this.table) {

        return {
            style: this.default.grid,
            table: {
                headerRows: this.default.headerRows,
                widths: this.default.tableWidths,
                body: [this.setHeader(table.info.header), ...this.setRow(table.info.data)],
            },
            layout: this.default.layout,
        }
    }

    // set the content for the document definition to create the table.
    setContent() {
        let tableBody = this.table.map((value, index) => {
            this.sheetIndex = index;
            return [
                { text: value.sheet, style: this.default.sheetName },
                this.setTable(value),
                { text: '', pageBreak: index !== (this.table.length - 1) ? 'after' : '' } // to set new sheet in a new page.
            ];
        }).flat();

        this.docDefinition.content.push(...tableBody);

        return tableBody;
    }

    // This is the entry function that create the file based on the input format.
    setFile(table) {
        if (table && Array.isArray(table)) {
            this.table = table;
            this.docDefinition = {
                content: this.setContent(),
                styles: this.setTableStyle(),
            };
        } else {
            this.table = [{
                sheet: 'gridData',
                info: {
                    header: this.table.info.header,
                    data: this.table.info.data,
                }
            }];
            this.docDefinition = {
                content: this.setContent(),
                styles: this.setTableStyle(),
            };
        }

    }

    // write the pdf file.
    async write(req, res, filename) {
        const pdfMake = new PdfPrinter(fonts);
        const pdfDoc = pdfMake.createPdfKitDocument(this.docDefinition);

        try {
            // set the response header with content type and content disposition.
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment;filename=${filename}.pdf`,
                "Access-Control-Expose-Headers": "Content-Disposition"
            });
            await pdfDoc.pipe(res); // pdfDoc returns the stream. 
            pdfDoc.end();
        } catch (error) {
            res.status(500).end();
        }
    }
    //refer---->  https://pdfkit.org/docs/guide.pdf
    
//   public async pdfWriter(req: Request, h: ResponseToolkit) {
//     const filename = 'grid';
//     pdfWriterService.setFile(mockData);
//     const pdf = pdfWriterService.write();
//     pdf.end();
//     const pdfBuffer = await new Promise((resolve) => {
//       const buffers: Array<Buffer> = [];
//       pdf.on('data', buffers.push.bind(buffers));
//       pdf.on('end', () => {
//         const pdfData = new Uint8Array(Buffer.concat(buffers));
//         resolve(pdfData);
//       });
//     });
//     const stream = new Readable();
//     stream.push(pdfBuffer);
//     stream.push(null);

//     try {
//       return h
//         .response(stream)
//         .header('Content-Type', 'application/pdf')
//         .header('Content-Disposition', `attachment;filename=${filename}.pdf`)
//         .header('Access-Control-Expose-Headers', 'Content-Disposition');
//     } catch (err) {
//       return httpHelper.error(err);
//     }
//   }

};

const pdf = new PDFWriter();

module.exports = pdf;
