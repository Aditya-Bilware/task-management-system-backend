const baseTemplate = ({ title, content }) => {
  return `<div style="
        font-family:Arial, sans-serif;
        background:#f4f5f7;
        padding:24px;
    ">
       <div style="
            max-width:650px;
            margin:auto;
            background:white;
            border-radius:10px;
            overflow:hidden;
            border:1px solid #e5e7eb;
    ">
        <div style="
            background:#1f2937;
            color:white;
            padding:20px 24px;
      ">
            <h2 style="margin:0;">
            ${title}
            </h2>
        </div>

        <div style="padding:24px;">
            ${content}
        </div>

        <div style="
            padding:16px 24px;
            border-top:1px solid #e5e7eb;
            color:#6b7280;
            font-size:12px;
        ">
            This is an automated notification from Task Management System.
        </div>

    </div>
  </div>
  `;
};

module.exports = baseTemplate;
