import { useState } from "react";
import { BiCloudUpload } from "react-icons/bi";
import { FaQrcode } from "react-icons/fa";
import QRCode from "qrcode";
import * as xlsx from "xlsx";
import VCard from "vcard-creator";
import { ColorRing } from "react-loader-spinner";

export default function Body() {
  const [file, setFile] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [qrCodeList, setQRCodeList] = useState(null);
  const [loading, setLoading] = useState({
    uploadFile: false,
    generateQR: false,
    downloadImages: false,
  });

  const capitalize = (string = "") => {
    const text = string.split(" ").map((str) => str.toLowerCase());
    const capitalized = text.map((txt) => {
      return txt.substring(0, 1).toUpperCase() + txt.substring(1);
    });
    return capitalized.join(" ");
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (e.target.files) {
      if (e.target.files.lenght === 0) {
        setLoading((current) => {
          return {
            ...current,
            uploadFile: false,
          };
        });
        return;
      }
      setFileName(e.target.files[0]["name"]);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const items = xlsx.utils.sheet_to_json(worksheet);
        setFile(
          items.map((item) => ({
            name: item[`NAME`],
            organization: capitalize(item[`COMPANY/DEPARTMENT`]),
            mobile_number:
              item[`MOBILE NUMBER`].toString().substring(0, 1) != 0
                ? "+63" + item[`MOBILE NUMBER`].toString()
                : "+639" + item[`MOBILE NUMBER`].toString().substring(1),
            email: item[`EMAIL`],
            url: item[`WEBSITE`],
          }))
        );
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };
  const convertToQR = async (list = []) => {
    try {
      const qrCodeUrls = await Promise.all(
        list.map(async (user) => {
          const vcard = new VCard();
          vcard
            // Add personal data
            .addName(user.name)
            // Add work data
            .addCompany(user.organization, "")
            .addEmail(user.email === "N/A" ? "" : user.email, "PREF;WORK")
            .addPhoneNumber(user.mobile_number, "PREF;WORK")
            .addURL(user.url);

          const url = await QRCode.toDataURL(vcard.buildVCard());
          return url;
        })
      );

      // Set the QRCodeList state with all the QR code URLs
      setQRCodeList(qrCodeUrls);
    } catch (err) {
      console.error(err);
    }
    setLoading((current) => {
      return {
        ...current,
        generateQR: false,
      };
    });
  };
  const handleDownloadAll = () => {
    const qr_list = document.querySelector(".qr_list");
    const children = [...qr_list.children];

    const downloadGroup = (start, end) => {
      for (let i = start; i < end; i++) {
        if (i >= children.length) {
          setLoading((current) => ({
            ...current,
            downloadImages: false,
          }));
          return; // All images downloaded, exit the function
        }

        setTimeout(() => {
          children[i].click();
        }, (i - start) * 150);
      }

      // Continue downloading the next group after a delay
      setTimeout(() => {
        downloadGroup(end, end + 10);
      }, (end - start) * 150);
    };

    setLoading((current) => ({
      ...current,
      downloadImages: true,
    }));

    downloadGroup(0, 10);
  };

  return (
    <>
      {(loading.uploadFile || loading.generateQR || loading.downloadImages) && (
        <div className="loader">
          <ColorRing
            visible={true}
            height="100"
            width="100"
            ariaLabel="blocks-loading"
            wrapperStyle={{}}
            wrapperClass="blocks-wrapper"
            colors={["#1d8c77", "#3e4977", "#12604e", "#8a8eae"]}
          />
        </div>
      )}
      <main>
        <form
          onSubmit={(e) => {
            handleFileSubmit(e);
          }}
          encType="multipart/form-data"
        >
          <div className="form-group">
            <label htmlFor="file">
              <BiCloudUpload />
              <span>Click to upload files</span>
              <span>------------ or ------------</span>
              <span>Drag and drop files here</span>
            </label>
            <input
              type="file"
              id="file"
              onClick={() =>
                setLoading((current) => {
                  return {
                    ...current,
                    uploadFile: true,
                  };
                })
              }
              onChange={(e) => {
                handleFileSubmit(e);
                setLoading((current) => {
                  return {
                    ...current,
                    uploadFile: false,
                  };
                });
              }}
            />
          </div>
        </form>
        <div className="file_name">
          {fileName ? <span>{fileName}</span> : "No File Selected"}
        </div>
        <button
          type="button"
          className="generate_qr"
          disabled={!fileName}
          onClick={() => {
            setLoading((current) => {
              return {
                ...current,
                generateQR: true,
              };
            });
            convertToQR(file);
          }}
        >
          {loading.generateQR ? (
            <>Loading...</>
          ) : (
            <>
              <FaQrcode />
              <span>Generate QR</span>
            </>
          )}
        </button>
        {qrCodeList && (
          <div className="qr_container">
            <div className="qr_header">
              <p>VCard QRs</p>
              <button
                onClick={() => {
                  setLoading((current) => {
                    return {
                      ...current,
                      downloadImages: true,
                    };
                  });
                  handleDownloadAll();
                }}
              >
                Download All
              </button>
            </div>
            <div className="qr_list">
              {qrCodeList.map((qr, key) => {
                return (
                  <a
                    key={key}
                    className="qr_item"
                    href={qr}
                    download={file[key].name + ".png"}
                  >
                    <img src={qr} />
                    <div className="qr_info">
                      <span>{file[key].name}</span>
                      <span>{file[key].organization}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
